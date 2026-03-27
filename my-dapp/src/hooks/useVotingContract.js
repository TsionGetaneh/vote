import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { getContract, getReadOnlyContract } from '../contract';

export const useVotingContract = () => {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Ethers v6 returns uint256 values as `bigint`. Ethers v5 returned BigNumber with `.toNumber()`.
  // This helper makes the UI resilient to either return type.
  const toJsNumber = (value) => {
    if (value == null) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'bigint') return Number(value);
    if (typeof value?.toNumber === 'function') return value.toNumber();
    if (typeof value?.toString === 'function') return Number(value.toString());
    return Number(value);
  };

  // Extract the most useful revert/error message for the UI.
  const getErrorMessage = (err) => {
    if (!err) return 'Unknown error';
    if (typeof err === 'string') return err;
    if (err.reason) return err.reason;
    if (err.shortMessage) return err.shortMessage;
    if (err?.data?.message && typeof err.data.message === 'string') return err.data.message;
    if (err?.error?.message && typeof err.error.message === 'string') return err.error.message;
    if (err.message && typeof err.message === 'string') return err.message;
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  };

  // Connect wallet
  const connectWallet = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed');
      }

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const contractInstance = await getContract();
      setContract(contractInstance);
      setAccount(accounts[0]);
      
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    const autoConnect = async () => {
      try {
        if (typeof window.ethereum !== 'undefined') {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const contractInstance = await getContract();
            setContract(contractInstance);
            setAccount(accounts[0]);
          }
        }
      } catch (err) {
        console.error('Auto-connect failed:', err);
      }
    };

    autoConnect();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          setAccount(null);
          setContract(null);
        } else {
          setAccount(accounts[0]);
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, []);

  // Vote for a candidate
  const vote = useCallback(async (candidateId) => {
    if (!contract) throw new Error('Contract not initialized');
    
    try {
      setLoading(true);

      // Simulate the call first so we can surface the revert reason early.
      // This prevents sending a tx that MetaMask will fail.
      await contract.vote.staticCall(candidateId);

      const tx = await contract.vote(candidateId);
      await tx.wait();
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contract]);

  // Register a voter
  const registerVoter = useCallback(async (voterAddress) => {
    if (!contract) throw new Error('Contract not initialized');
    
    try {
      setLoading(true);
      const tx = await contract.registerVoter(voterAddress);
      await tx.wait();
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contract]);

  // Add a candidate
  const addCandidate = useCallback(async (name) => {
    if (!contract) throw new Error('Contract not initialized');
    
    try {
      setLoading(true);
      const tx = await contract.addCandidate(name);
      await tx.wait();
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [contract]);

  // Get all candidates
  const getAllCandidates = useCallback(async () => {
    try {
      const contractInstance = contract || await getReadOnlyContract();
      // Prefer an ID-stable approach (count + getCandidate) so voting uses the correct candidateId.
      // SecureVoting variants are sometimes 0-based (0..count-1) and sometimes 1-based (1..count).
      const countRaw = await contractInstance.getCandidateCount();
      const count = toJsNumber(countRaw);
      if (!count || count <= 0) return [];

      const readMetaMap = () => {
        if (typeof window === 'undefined') return {};
        try {
          const raw = window.localStorage.getItem('candidateMetaV1');
          if (!raw) return {};
          const parsed = JSON.parse(raw);
          return parsed && typeof parsed === 'object' ? parsed : {};
        } catch {
          return {};
        }
      };

      const metaMap = readMetaMap();

      const fetchRange = async (startId) => {
        const results = [];
        for (let i = 0; i < count; i++) {
          const id = startId + i;
          const c = await contractInstance.getCandidate(id);
          const name = Array.isArray(c) ? c[0] : c?.name;
          const voteCount = Array.isArray(c) ? c[1] : c?.voteCount;
          const meta = metaMap[String(id)] || metaMap[id] || {};
          results.push({
            id,
            name: name ?? '',
            voteCount: toJsNumber(voteCount),
            description: meta?.description ?? '',
            imageUrl: meta?.imageUrl ?? ''
          });
        }
        return results;
      };

      // Try 0-based first; if any call reverts, fall back to 1-based.
      try {
        return await fetchRange(0);
      } catch (e0) {
        try {
          return await fetchRange(1);
        } catch (e1) {
          setError(getErrorMessage(e1) || getErrorMessage(e0));
          return [];
        }
      }
    } catch (err) {
      setError(getErrorMessage(err));
      return [];
    }
  }, [contract]);

  // Get voting status
  const getVotingStatus = useCallback(async () => {
    try {
      const contractInstance = contract || await getReadOnlyContract();
      const status = await contractInstance.votingStatus();
      return status;
    } catch (err) {
      // Voting status is a read-only check; don't overwrite UI errors from tx failures.
      console.error('Error fetching voting status:', err);
      return 'Unknown';
    }
  }, [contract]);

  // Check if voter is registered
  const isVoterRegistered = useCallback(async (voterAddress = account) => {
    if (!voterAddress) return false;
    
    try {
      const contractInstance = contract || await getReadOnlyContract();
      const isRegistered = await contractInstance.isRegistered(voterAddress);
      return isRegistered;
    } catch (err) {
      // Read-only check; avoid polluting tx error messaging.
      console.error('Error checking voter registration:', err);
      return false;
    }
  }, [contract, account]);

  // Check if voter has voted
  const hasVoterVoted = useCallback(async (voterAddress = account) => {
    if (!voterAddress) return false;
    
    try {
      const contractInstance = contract || await getReadOnlyContract();
      const hasVoted = await contractInstance.hasVoted(voterAddress);
      return hasVoted;
    } catch (err) {
      // Read-only check; avoid polluting tx error messaging.
      console.error('Error checking hasVoted:', err);
      return false;
    }
  }, [contract, account]);

  // Get winner
  const getWinner = useCallback(async () => {
    try {
      const contractInstance = contract || await getReadOnlyContract();
      const winner = await contractInstance.getWinner();
      return {
        name: winner.winnerName,
        votes: toJsNumber(winner.winnerVotes)
      };
    } catch (err) {
      // Winner is read-only; don't overwrite UI tx errors.
      console.error('Error fetching winner:', err);
      return null;
    }
  }, [contract]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    account,
    contract,
    loading,
    error,
    connectWallet,
    vote,
    registerVoter,
    addCandidate,
    getAllCandidates,
    getVotingStatus,
    isVoterRegistered,
    hasVoterVoted,
    getWinner,
    clearError,
    isConnected: !!account
  };
};
