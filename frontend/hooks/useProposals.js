'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const useProposals = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['proposals', page, limit],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/api/proposals`, {
        params: { page, limit }
      });
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useProposal = (id) => {
  return useQuery({
    queryKey: ['proposal', id],
    queryFn: async () => {
      const { data } = await axios.get(`${API_URL}/api/proposals/${id}`);
      return data;
    },
    enabled: !!id,
    refetchInterval: 10000,
  });
};

export const useVote = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ proposalId, voteType, signer }) => {
      const { getContract } = await import('@/lib/contract');
      const contract = getContract(signer);
      const tx = await contract.castVote(proposalId, voteType);
      return tx.wait();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(['proposal', variables.proposalId]);
      queryClient.invalidateQueries(['proposals']);
    },
  });
};