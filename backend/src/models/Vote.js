import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema({
  proposalId: {
    type: Number,
    required: true,
    index: true
  },
  voterAddress: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  voteType: {
    type: Number,
    required: true,
    enum: [0, 1, 2],
    min: 0,
    max: 2
  },
  transactionHash: {
    type: String,
    required: true,
    unique: true
  },
  blockNumber: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  network: {
    type: String,
    default: 'sepolia'
  }
}, {
  timestamps: true
});

voteSchema.index({ proposalId: 1, voterAddress: 1 }, { unique: true });

voteSchema.statics.getVotingHistory = async function(address) {
  return this.find({ voterAddress: address.toLowerCase() })
    .sort({ createdAt: -1 })
    .lean();
};

voteSchema.statics.getProposalVotes = async function(proposalId) {
  return this.find({ proposalId }).sort({ createdAt: -1 }).lean();
};

const Vote = mongoose.model('Vote', voteSchema);
export default Vote;