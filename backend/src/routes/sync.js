import express from 'express';
import blockchainService from '../services/blockchainService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { fromBlock = 0 } = req.body;
    const syncedCount = await blockchainService.syncHistoricalEvents(fromBlock);
    res.json({ 
      message: 'Sync completed',
      syncedEvents: syncedCount 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/status', async (req, res) => {
  try {
    const latestBlock = await blockchainService.provider.getBlockNumber();
    const proposalCount = await blockchainService.getProposalCount();
    
    res.json({
      latestBlock,
      proposalCount,
      contractAddress: blockchainService.contract.target,
      isListening: true
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;