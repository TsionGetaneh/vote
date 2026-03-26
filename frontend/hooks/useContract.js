'use client';

import { useCallback, useState } from 'react';
import { getContract } from '@/lib/contract';

export const useContract = (signer) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const getContractInstance = useCallback(() => {
    if (!signer) throw new Error('Wallet not connected');
    return getContract(signer);
  }, [signer]);

  const createProposal = useCallback(async (title, description, duration, delay = 0) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const contract = getContractInstance();
      const tx = await contract.createProposal(
        title,
        description,
        '', // ipfsHash
        duration,
        delay
      );
      const receipt = await tx.wait();
      return receipt;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getContractInstance]);

  const castVote = useCallback(async (proposalId, voteType) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const contract = getContractInstance();
      const tx = await contract.castVote(proposalId, voteType);
      const receipt = await tx.wait();
      return receipt;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getContractInstance]);

  return {
    createProposal,
    castVote,
    isLoading,
    error
  };
};