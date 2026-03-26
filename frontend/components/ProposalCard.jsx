'use client';

import { useState } from 'react';
import { useProposal, useVote } from '@/hooks/useProposals';
import { useWallet } from '@/hooks/useWallet';
import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, ThumbsDown, Minus, Clock, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

const VoteType = {
  AGAINST: 0,
  FOR: 1,
  ABSTAIN: 2
};

export const ProposalCard = ({ proposal, userAddress }) => {
  const { signer } = useWallet();
  const { data: detailedProposal } = useProposal(proposal.id);
  const voteMutation = useVote();
  const [hasVoted, setHasVoted] = useState(false);

  const totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;
  const forPercent = totalVotes > 0 ? (proposal.forVotes / totalVotes) * 100 : 0;
  const againstPercent = totalVotes > 0 ? (proposal.againstVotes / totalVotes) * 100 : 0;
  
  const isActive = proposal.status === 'Active' && Date.now() / 1000 < proposal.endTime;
  const timeLeft = formatDistanceToNow(new Date(proposal.endTime * 1000), { addSuffix: true });

  const handleVote = async (voteType) => {
    if (!signer) return;
    try {
      await voteMutation.mutateAsync({
        proposalId: proposal.id,
        voteType,
        signer
      });
      setHasVoted(true);
    } catch (error) {
      console.error('Vote failed:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-xs font-medium text-gray-500">#{proposal.id}</span>
          <h3 className="text-lg font-semibold text-gray-900 mt-1">{proposal.title}</h3>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {isActive ? 'Active' : proposal.status}
        </span>
      </div>

      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
        {proposal.description}
      </p>

      {/* Vote Progress */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-xs text-gray-500">
          <span>For: {proposal.forVotes}</span>
          <span>{forPercent.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${forPercent}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-gray-500">
          <span>Against: {proposal.againstVotes}</span>
          <span>{againstPercent.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-red-500 h-2 rounded-full transition-all"
            style={{ width: `${againstPercent}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center gap-1">
          <Clock size={14} />
          {isActive ? `Ends ${timeLeft}` : 'Voting ended'}
        </div>
        <span>{totalVotes} total votes</span>
      </div>

      {/* Vote Actions */}
      {isActive && !hasVoted && (
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleVote(VoteType.FOR)}
            disabled={voteMutation.isPending || !signer}
            className="flex items-center justify-center gap-1 bg-green-50 text-green-700 py-2 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
          >
            <ThumbsUp size={16} />
            For
          </button>
          <button
            onClick={() => handleVote(VoteType.AGAINST)}
            disabled={voteMutation.isPending || !signer}
            className="flex items-center justify-center gap-1 bg-red-50 text-red-700 py-2 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <ThumbsDown size={16} />
            Against
          </button>
          <button
            onClick={() => handleVote(VoteType.ABSTAIN)}
            disabled={voteMutation.isPending || !signer}
            className="flex items-center justify-center gap-1 bg-gray-50 text-gray-700 py-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <Minus size={16} />
            Abstain
          </button>
        </div>
      )}

      {hasVoted && (
        <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 py-2 rounded-lg">
          <CheckCircle2 size={16} />
          Vote recorded!
        </div>
      )}

      {!isActive && (
        <Link 
          href={`/proposal/${proposal.id}`}
          className="block text-center text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          View Results →
        </Link>
      )}
    </div>
  );
};