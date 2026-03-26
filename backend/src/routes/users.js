import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { ethers } from 'ethers';
import User from '../models/User.js';
import Vote from '../models/Vote.js';
import blockchainService from '../services/blockchainService.js';

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post('/nonce', [
  body('address').isEthereumAddress(),
  validate
], async (req, res) => {
  try {
    let user = await User.findOne({ address: req.body.address.toLowerCase() });
    
    if (!user) {
      user = new User({ address: req.body.address.toLowerCase() });
    }
    
    const nonce = user.generateNonce();
    await user.save();
    
    res.json({ nonce });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/verify', [
  body('address').isEthereumAddress(),
  body('signature').isString(),
  validate
], async (req, res) => {
  try {
    const { address, signature } = req.body;
    const user = await User.findOne({ address: address.toLowerCase() });
    
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const message = `Sign this message to authenticate: ${user.nonce}`;
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    user.generateNonce();
    user.lastLogin = new Date();
    await user.save();

    const onChainHistory = await blockchainService.contract.getUserVotingHistory(address);
    const dbHistory = await Vote.getVotingHistory(address);

    res.json({
      authenticated: true,
      address,
      onChainHistory: onChainHistory.map(id => Number(id)),
      dbHistory
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:address/history', [
  param('address').isEthereumAddress(),
  validate
], async (req, res) => {
  try {
    const address = req.params.address.toLowerCase();
    const [dbHistory, onChainIds] = await Promise.all([
      Vote.getVotingHistory(address),
      blockchainService.contract.getUserVotingHistory(address)
    ]);

    const detailedHistory = await Promise.all(
      dbHistory.map(async (vote) => {
        const proposal = await blockchainService.getProposal(vote.proposalId);
        return {
          ...vote,
          proposalTitle: proposal.title,
          proposalStatus: proposal.status
        };
      })
    );

    res.json({
      address,
      totalVotes: dbHistory.length,
      onChainVoteCount: onChainIds.length,
      votes: detailedHistory
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;