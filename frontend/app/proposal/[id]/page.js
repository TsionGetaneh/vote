'use client';

import { useParams } from 'next/navigation';
import { useProposal } from '@/hooks/useProposals';
import { formatDistanceToNow } from 'date-fns';

export default function ProposalDetail() {
  const { id } = useParams();
  const { data: proposal, isLoading } = useProposal(id);

  if (isLoading) return <div className="p-8">Loading...</div>;
  if (!proposal) return <div className="p-8">Proposal not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">{proposal.title}</h1>
      <p className="text-gray-600 mb-8">{proposal.description}</p>
      
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-700">{proposal.forVotes}</div>
          <div className="text-sm text-green-600">For</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-700">{proposal.againstVotes}</div>
          <div className="text-sm text-red-600">Against</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-700">{proposal.abstainVotes}</div>
          <div className="text-sm text-gray-600">Abstain</div>
        </div>
      </div>

      {proposal.results && (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h3 className="font-semibold mb-4">Detailed Results</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>For:</span>
              <span>{proposal.results.forPercentage}%</span>
            </div>
            <div className="flex justify-between">
              <span>Against:</span>
              <span>{proposal.results.againstPercentage}%</span>
            </div>
            <div className="flex justify-between">
              <span>Abstain:</span>
              <span>{proposal.results.abstainPercentage}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}