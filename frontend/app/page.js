'use client';

import { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x9ccF3d67acECa28D898B346FCd3DABF24ec1A442';

const ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "_proposalId", "type": "uint256" },
      { "internalType": "enum DecentralizedVoting.VoteType", "name": "_voteType", "type": "uint8" }
    ],
    "name": "castVote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_title", "type": "string" },
      { "internalType": "string", "name": "_description", "type": "string" },
      { "internalType": "string", "name": "_ipfsHash", "type": "string" },
      { "internalType": "uint256", "name": "_duration", "type": "uint256" },
      { "internalType": "uint256", "name": "_delay", "type": "uint256" }
    ],
    "name": "createProposal",
    "outputs": [{ "internalType": "uint256", "name": "proposalId", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_proposalId", "type": "uint256" }],
    "name": "getProposal",
    "outputs": [{
      "components": [
        { "internalType": "uint256", "name": "id", "type": "uint256" },
        { "internalType": "string", "name": "title", "type": "string" },
        { "internalType": "string", "name": "description", "type": "string" },
        { "internalType": "address", "name": "creator", "type": "address" },
        { "internalType": "uint256", "name": "startTime", "type": "uint256" },
        { "internalType": "uint256", "name": "endTime", "type": "uint256" },
        { "internalType": "uint256", "name": "forVotes", "type": "uint256" },
        { "internalType": "uint256", "name": "againstVotes", "type": "uint256" },
        { "internalType": "uint256", "name": "abstainVotes", "type": "uint256" },
        { "internalType": "uint8", "name": "status", "type": "uint8" },
        { "internalType": "uint256", "name": "totalVotes", "type": "uint256" }
      ],
      "internalType": "struct DecentralizedVoting.ProposalView",
      "name": "",
      "type": "tuple"
    }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_proposalId", "type": "uint256" },
      { "internalType": "address", "name": "_voter", "type": "address" }
    ],
    "name": "hasVoted",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "proposalCounter",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
];

export default function Home() {
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [voting, setVoting] = useState({});
  const [hasVotedMap, setHasVotedMap] = useState({});
  const [error, setError] = useState(null);

  // Fetch proposals from blockchain directly
  const fetchProposals = useCallback(async () => {
    try {
      setLoading(true);
      
      // Create read-only provider
      const provider = new ethers.JsonRpcProvider('https://ethereum-sepolia-rpc.publicnode.com');
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
      
      // Get proposal count
      const count = await contract.proposalCounter();
      const totalCount = Number(count);
      
      if (totalCount === 0) {
        setProposals([]);
        setLoading(false);
        return;
      }

      // Fetch all proposals
      const proposalList = [];
      for (let i = 1; i <= totalCount; i++) {
        try {
          const p = await contract.getProposal(i);
          const now = Math.floor(Date.now() / 1000);
          const endTime = Number(p.endTime);
          const status = Number(p.status);
          
          proposalList.push({
            id: Number(p.id),
            title: p.title,
            description: p.description,
            creator: p.creator,
            startTime: Number(p.startTime),
            endTime: endTime,
            forVotes: Number(p.forVotes),
            againstVotes: Number(p.againstVotes),
            abstainVotes: Number(p.abstainVotes),
            status: ['Pending', 'Active', 'Ended', 'Executed'][status] || 'Unknown',
            totalVotes: Number(p.totalVotes),
            isActive: status === 1 && now < endTime
          });
        } catch (e) {
          console.error(`Error fetching proposal ${i}:`, e);
        }
      }
      
      // Sort by newest first
      proposalList.reverse();
      setProposals(proposalList);
      setError(null);
      
      // Check vote status for current account
      if (account && signer) {
        checkVotedStatus(account, proposalList, signer);
      }
      
    } catch (err) {
      console.error('Failed to fetch proposals:', err);
      setError('Failed to load proposals: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [account, signer]);

  // Check if user has voted
  const checkVotedStatus = async (address, proposalList, currentSigner) => {
    if (!currentSigner || !address || !proposalList.length) return;
    
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, currentSigner);
    const votedMap = {};
    
    for (const proposal of proposalList) {
      try {
        const hasVoted = await contract.hasVoted(proposal.id, address);
        votedMap[proposal.id] = hasVoted;
      } catch (err) {
        votedMap[proposal.id] = false;
      }
    }
    
    setHasVotedMap(votedMap);
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    if (typeof window === 'undefined') {
      alert('Please use a browser');
      return;
    }
    
    if (!window.ethereum) {
      alert('MetaMask not installed! https://metamask.io/download/');
      return;
    }

    setConnecting(true);
    setError(null);
    
    try {
      // Request account access - triggers MetaMask popup
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned');
      }
      
      const userAddress = accounts[0];
      
      // Create provider and signer
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      
      setAccount(userAddress);
      setSigner(web3Signer);
      
      // Setup listeners
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
      
      // Fetch proposals with new signer
      await fetchProposals();
      
    } catch (err) {
      console.error('Connection error:', err);
      if (err.code === 4001) {
        setError('You rejected the connection in MetaMask');
      } else {
        setError('Failed to connect: ' + err.message);
      }
    } finally {
      setConnecting(false);
    }
  };

  const handleAccountsChanged = useCallback(async (accounts) => {
    if (!accounts || accounts.length === 0) {
      disconnectWallet();
    } else {
      const newAddress = accounts[0];
      setAccount(newAddress);
      
      if (window.ethereum) {
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        const web3Signer = await web3Provider.getSigner();
        setSigner(web3Signer);
        await checkVotedStatus(newAddress, proposals, web3Signer);
      }
    }
  }, [proposals]);

  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setSigner(null);
    setHasVotedMap({});
    if (window.ethereum) {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    }
  }, [handleAccountsChanged]);

  // CAST VOTE - This is the main function
  const handleVote = async (proposalId, voteType) => {
    if (!signer || !account) {
      alert('Please connect MetaMask first!');
      return;
    }

    // voteType: 0 = Against, 1 = For, 2 = Abstain
    const voteTypeName = voteType === 1 ? 'FOR' : 'AGAINST';
    
    if (!confirm(`You are voting ${voteTypeName} on proposal #${proposalId}.\n\nThis will cost gas. Continue?`)) {
      return;
    }

    setVoting(prev => ({ ...prev, [proposalId]: true }));
    
    try {
      // Create contract with signer (for transactions)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      
      console.log(`Sending vote transaction: proposal ${proposalId}, type ${voteType}`);
      
      // Send transaction - MetaMask will popup
      const tx = await contract.castVote(proposalId, voteType);
      
      console.log('Transaction sent:', tx.hash);
      console.log('Waiting for confirmation...');
      
      // Wait for blockchain confirmation
      const receipt = await tx.wait();
      
      console.log('Transaction confirmed:', receipt);
      console.log('Gas used:', receipt.gasUsed.toString());
      
      // IMMEDIATELY update local state to show new vote
      setProposals(prevProposals => 
        prevProposals.map(p => {
          if (p.id === proposalId) {
            return {
              ...p,
              forVotes: voteType === 1 ? p.forVotes + 1 : p.forVotes,
              againstVotes: voteType === 0 ? p.againstVotes + 1 : p.againstVotes,
              totalVotes: p.totalVotes + 1
            };
          }
          return p;
        })
      );
      
      // Mark as voted
      setHasVotedMap(prev => ({ ...prev, [proposalId]: true }));
      
      alert(`✅ Vote recorded!\n\nTransaction: ${tx.hash.slice(0, 20)}...\nGas used: ${receipt.gasUsed.toString()}`);
      
      // Refresh from blockchain after 2 seconds to confirm
      setTimeout(() => {
        fetchProposals();
      }, 2000);
      
    } catch (err) {
      console.error('Voting error:', err);
      
      if (err.code === 4001) {
        alert('❌ You rejected the transaction in MetaMask');
      } else if (err.message?.includes('already voted')) {
        alert('❌ You have already voted on this proposal');
        setHasVotedMap(prev => ({ ...prev, [proposalId]: true }));
      } else if (err.message?.includes('not active')) {
        alert('❌ Voting period has ended');
      } else {
        alert('❌ Voting failed: ' + (err.reason || err.message));
      }
    } finally {
      setVoting(prev => ({ ...prev, [proposalId]: false }));
    }
  };

  // Create proposal
  const createProposal = async () => {
    if (!signer || !account) {
      alert('Connect MetaMask first!');
      return;
    }
    
    const title = prompt('Enter proposal title:');
    if (!title) return;
    
    const description = prompt('Enter description:');
    if (!description) return;
    
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      
      // Create proposal with 1 hour duration
      const tx = await contract.createProposal(title, description, '', 3600, 0);
      
      console.log('Create proposal transaction:', tx.hash);
      
      await tx.wait();
      alert('✅ Proposal created!');
      
      // Refresh list
      fetchProposals();
    } catch (err) {
      console.error('Create error:', err);
      if (err.code === 4001) {
        alert('❌ Transaction rejected');
      } else {
        alert('❌ Failed: ' + err.message);
      }
    }
  };

  // Load on mount
  useEffect(() => {
    fetchProposals();
    
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [fetchProposals, handleAccountsChanged]);

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (loading && proposals.length === 0) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontSize: '1.2rem',
        backgroundColor: '#f3f4f6'
      }}>
        Loading proposals from blockchain...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', padding: '2rem' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
              🗳️ Voting DApp
            </h1>
            <p style={{ color: '#6b7280', margin: '0.5rem 0 0 0' }}>
              Your vote is recorded on the blockchain
            </p>
          </div>
          
          <div>
            {account ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    backgroundColor: '#dcfce7', 
                    color: '#166534',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    fontFamily: 'monospace'
                  }}>
                    {formatAddress(account)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>
                    🟢 Connected
                  </div>
                </div>
                <button 
                  onClick={disconnectWallet}
                  style={{
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button 
                onClick={connectWallet}
                disabled={connecting}
                style={{
                  backgroundColor: connecting ? '#9ca3af' : '#2563eb',
                  color: 'white',
                  padding: '0.875rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: connecting ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                  fontSize: '1rem'
                }}
              >
                {connecting ? 'Connecting...' : '🔗 Connect MetaMask'}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div style={{ 
            backgroundColor: '#fee2e2', 
            color: '#991b1b', 
            padding: '1rem', 
            borderRadius: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Create Proposal */}
        {account && (
          <div style={{ 
            backgroundColor: 'white', 
            padding: '1.5rem', 
            borderRadius: '0.75rem',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>Create Proposal</h3>
                <p style={{ margin: '0.25rem 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
                  Costs gas (SepoliaETH)
                </p>
              </div>
              <button
                onClick={createProposal}
                style={{
                  backgroundColor: '#10b981',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                ➕ New Proposal
              </button>
            </div>
          </div>
        )}

        {!account && (
          <div style={{ 
            backgroundColor: '#fef3c7', 
            border: '1px solid #f59e0b',
            color: '#92400e',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            <strong>Connect MetaMask to vote on proposals</strong>
          </div>
        )}

        {/* Refresh button */}
        <div style={{ marginBottom: '1rem', textAlign: 'right' }}>
          <button
            onClick={fetchProposals}
            disabled={loading}
            style={{
              backgroundColor: loading ? '#e5e7eb' : 'white',
              color: '#374151',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              border: '1px solid #d1d5db',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem'
            }}
          >
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </button>
        </div>

        {/* Proposals */}
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {proposals.length === 0 ? (
            <div style={{ 
              backgroundColor: 'white', 
              padding: '4rem', 
              borderRadius: '0.75rem',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <p style={{ fontSize: '1.25rem', fontWeight: 500 }}>
                No proposals found
              </p>
              <p>Connect wallet and create one!</p>
            </div>
          ) : (
            proposals.map((p) => (
              <div 
                key={p.id} 
                style={{
                  backgroundColor: 'white',
                  padding: '1.5rem',
                  borderRadius: '0.75rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  borderLeft: p.isActive ? '4px solid #10b981' : '4px solid #9ca3af'
                }}
              >
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ 
                      backgroundColor: p.isActive ? '#dcfce7' : '#f3f4f6',
                      color: p.isActive ? '#166534' : '#6b7280',
                      padding: '0.375rem 0.875rem',
                      borderRadius: '9999px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase'
                    }}>
                      {p.isActive ? '🟢 Active' : '🔴 Ended'}
                    </span>
                    <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                      #{p.id} • {formatAddress(p.creator)}
                    </span>
                  </div>
                  
                  <h2 style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 'bold',
                    margin: '0 0 0.75rem 0'
                  }}>
                    {p.title}
                  </h2>
                  
                  <p style={{ color: '#4b5563', margin: 0, lineHeight: 1.6 }}>
                    {p.description}
                  </p>
                </div>

                {/* Vote Counts - LIVE NUMBERS */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                  backgroundColor: '#f9fafb',
                  padding: '1rem',
                  borderRadius: '0.5rem'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: '2rem', 
                      fontWeight: 'bold', 
                      color: '#16a34a',
                      transition: 'all 0.3s'
                    }}>
                      {p.forVotes}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>👍 For</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                      fontSize: '2rem', 
                      fontWeight: 'bold', 
                      color: '#dc2626',
                      transition: 'all 0.3s'
                    }}>
                      {p.againstVotes}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>👎 Against</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6b7280' }}>
                      {p.totalVotes}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: 500 }}>Total Votes</div>
                  </div>
                </div>

                {/* Voting Buttons */}
                {p.isActive ? (
                  account ? (
                    hasVotedMap[p.id] ? (
                      <div style={{
                        backgroundColor: '#dcfce7',
                        color: '#166534',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        textAlign: 'center',
                        fontWeight: 600
                      }}>
                        ✅ You voted on this proposal
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                          onClick={() => handleVote(p.id, 1)}
                          disabled={voting[p.id]}
                          style={{
                            flex: 1,
                            backgroundColor: voting[p.id] ? '#d1d5db' : '#16a34a',
                            color: 'white',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            cursor: voting[p.id] ? 'not-allowed' : 'pointer',
                            fontWeight: 700,
                            fontSize: '1.1rem'
                          }}
                        >
                          {voting[p.id] ? 'Confirming...' : '👍 Vote For'}
                        </button>
                        <button
                          onClick={() => handleVote(p.id, 0)}
                          disabled={voting[p.id]}
                          style={{
                            flex: 1,
                            backgroundColor: voting[p.id] ? '#d1d5db' : '#dc2626',
                            color: 'white',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            cursor: voting[p.id] ? 'not-allowed' : 'pointer',
                            fontWeight: 700,
                            fontSize: '1.1rem'
                          }}
                        >
                          {voting[p.id] ? 'Confirming...' : '👎 Vote Against'}
                        </button>
                      </div>
                    )
                  ) : (
                    <button
                      onClick={connectWallet}
                      style={{
                        width: '100%',
                        backgroundColor: '#f3f4f6',
                        color: '#6b7280',
                        padding: '1rem',
                        borderRadius: '0.5rem',
                        border: '2px dashed #d1d5db',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      🔗 Connect Wallet to Vote
                    </button>
                  )
                ) : (
                  <div style={{
                    backgroundColor: '#f3f4f6',
                    color: '#6b7280',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    textAlign: 'center'
                  }}>
                    🏁 Voting ended
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}