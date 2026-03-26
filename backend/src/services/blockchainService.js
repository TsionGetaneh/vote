import { getContract, getProvider } from '../config/contract.js';
import Vote from '../models/Vote.js';

class BlockchainService {
  constructor() {
    this.contract = getContract();
    this.provider = getProvider();
    this.isPolling = false;
    
    // Don't use persistent filters on public RPCs - they don't support it
    // Instead, we'll use polling for new events
    this.startPolling();
  }

  startPolling() {
    console.log('📡 Starting event polling (public RPC mode)...');
    
    // Poll for new events every 10 seconds
    setInterval(async () => {
      try {
        await this.checkForNewEvents();
      } catch (error) {
        // Silently ignore polling errors
      }
    }, 10000);
  }

  async checkForNewEvents() {
    try {
      const filter = this.contract.filters.VoteCast();
      const latestBlock = await this.provider.getBlockNumber();
      // Check last 10 blocks for new events
      const fromBlock = Math.max(0, latestBlock - 10);
      
      const events = await this.contract.queryFilter(filter, fromBlock, latestBlock);
      
      for (const event of events) {
        const [proposalId, voter, voteType, timestamp] = event.args;
        
        // Try to save to DB if available
        try {
          if (Vote && Vote.findOneAndUpdate) {
            await Vote.findOneAndUpdate(
              { proposalId: Number(proposalId), voterAddress: voter.toLowerCase() },
              {
                proposalId: Number(proposalId),
                voterAddress: voter.toLowerCase(),
                voteType: Number(voteType),
                transactionHash: event.transactionHash,
                blockNumber: Number(event.blockNumber),
                timestamp: new Date(Number(timestamp) * 1000)
              },
              { upsert: true, new: true }
            );
          }
        } catch (dbError) {
          // DB not available, ignore
        }
      }
    } catch (error) {
      // Ignore polling errors
    }
  }

  async getProposal(proposalId) {
    try {
      const proposal = await this.contract.getProposal(proposalId);
      return this.formatProposal(proposal);
    } catch (error) {
      throw new Error(`Failed to fetch proposal: ${error.message}`);
    }
  }

  async getProposalsBatch(startId, count) {
    try {
      const proposals = await this.contract.getProposalsBatch(startId, count);
      return proposals.map(p => this.formatProposal(p));
    } catch (error) {
      throw new Error(`Failed to fetch proposals batch: ${error.message}`);
    }
  }

  async getResults(proposalId) {
    try {
      const results = await this.contract.getResults(proposalId);
      return {
        forVotes: results.forVotes.toString(),
        againstVotes: results.againstVotes.toString(),
        abstainVotes: results.abstainVotes.toString(),
        totalVotes: results.totalVotes.toString(),
        forPercentage: Number(results.forPercentage) / 100,
        againstPercentage: Number(results.againstPercentage) / 100,
        abstainPercentage: Number(results.abstainPercentage) / 100
      };
    } catch (error) {
      throw new Error(`Failed to fetch results: ${error.message}`);
    }
  }

  async getProposalCount() {
    const count = await this.contract.proposalCounter();
    return Number(count);
  }

  formatProposal(proposal) {
    const statusMap = ['Pending', 'Active', 'Ended', 'Executed'];
    const now = Math.floor(Date.now() / 1000);
    const endTime = Number(proposal.endTime);
    const status = Number(proposal.status);
    
    return {
      id: Number(proposal.id),
      title: proposal.title,
      description: proposal.description,
      ipfsHash: proposal.ipfsHash,
      creator: proposal.creator,
      startTime: Number(proposal.startTime),
      endTime: endTime,
      forVotes: Number(proposal.forVotes),
      againstVotes: Number(proposal.againstVotes),
      abstainVotes: Number(proposal.abstainVotes),
      status: statusMap[status] || 'Unknown',
      totalVotes: Number(proposal.totalVotes),
      isActive: status === 1 && now < endTime,
      hasEnded: now >= endTime
    };
  }

  async syncHistoricalEvents(fromBlock = 0) {
    try {
      const filter = this.contract.filters.VoteCast();
      const events = await this.contract.queryFilter(filter, fromBlock);
      
      console.log(`📊 Found ${events.length} historical vote events`);
      
      for (const event of events) {
        const [proposalId, voter, voteType, timestamp] = event.args;
        try {
          if (Vote && Vote.findOneAndUpdate) {
            await Vote.findOneAndUpdate(
              { proposalId: Number(proposalId), voterAddress: voter.toLowerCase() },
              {
                proposalId: Number(proposalId),
                voterAddress: voter.toLowerCase(),
                voteType: Number(voteType),
                transactionHash: event.transactionHash,
                blockNumber: Number(event.blockNumber),
                timestamp: new Date(Number(timestamp) * 1000)
              },
              { upsert: true }
            );
          }
        } catch (err) {
          // Ignore individual sync errors
        }
      }
      
      return events.length;
    } catch (error) {
      console.error('Sync failed:', error.message);
      return 0;
    }
  }
}

const blockchainService = new BlockchainService();
export { blockchainService };
export default blockchainService;