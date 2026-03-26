import express from 'express';
import { param, query, validationResult } from 'express-validator';
import blockchainService from '../services/blockchainService.js';
import Vote from '../models/Vote.js';

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.get('/', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  validate
], async (req, res) => {
  try {
    const page = req.query.page || 1;
    const limit = req.query.limit || 10;
    const totalCount = await blockchainService.getProposalCount();
    
    if (totalCount === 0) {
      return res.json({ proposals: [], pagination: { total: 0, page, limit, totalPages: 0 } });
    }

    const startId = totalCount - (page - 1) * limit;
    const count = Math.min(limit, startId);
    
    let proposals = [];
    if (startId > 0) {
      proposals = await blockchainService.getProposalsBatch(
        Math.max(1, startId - limit + 1),
        count
      );
      proposals.reverse();
    }

    res.json({
      proposals,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', [
  param('id').isInt({ min: 1 }).toInt(),
  validate
], async (req, res) => {
  try {
    const proposal = await blockchainService.getProposal(req.params.id);
    const results = await blockchainService.getResults(req.params.id);
    const dbVotes = await Vote.getProposalVotes(req.params.id);
    
    res.json({
      ...proposal,
      results,
      dbVoteCount: dbVotes.length,
      recentVotes: dbVotes.slice(0, 5)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/results', [
  param('id').isInt({ min: 1 }).toInt(),
  validate
], async (req, res) => {
  try {
    const results = await blockchainService.getResults(req.params.id);
    const proposal = await blockchainService.getProposal(req.params.id);
    
    res.json({
      proposalId: req.params.id,
      ...results,
      status: proposal.status,
      timeRemaining: proposal.endTime - Math.floor(Date.now() / 1000)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/votes', [
  param('id').isInt({ min: 1 }).toInt(),
  validate
], async (req, res) => {
  try {
    const votes = await Vote.getProposalVotes(req.params.id);
    res.json({
      proposalId: req.params.id,
      count: votes.length,
      votes
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;