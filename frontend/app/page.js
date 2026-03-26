'use client';

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x9ccF3d67acECa28D898B346FCd3DABF24ec1A442';

// Contract ABI
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
  const [provider, setProvider] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState({});
  const [error, setError] = useState(null);
  const [hasVotedMap, setHasVotedMap] = useState({});

  // Connect to MetaMask
  const connectWallet = async () => {
    if (typeof window === 'undefined') return;
    
    if (!window.ethereum) {
      alert('MetaMask not installed! Please install MetaMask extension.');
      return;
    }

    try {
      setLoading(true);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      
      setAccount(accounts[0]);
      setProvider(web3Provider);
      setSigner(web3Signer);
      setError(null);
      
      // Listen for account changes
      window.ethereum.on('accountsChanged', (newAccounts) => {
        if (newAccounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(newAccounts[0]);
        }
      });
      
    } catch (err) {
      console.error('Connection failed:', err);
      setError('Failed to connect wallet: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
    setProvider(null);
  };

  // Fetch proposals from backend
  const fetchProposals = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/api/proposals`);
      setProposals(data.proposals || []);
      
      // Check if user has voted on each proposal
      if (account && data.proposals) {
        checkVotedStatus(data.proposals);
      }
    } catch (err) {
      console.error('Failed to fetch proposals:', err);
      setError('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  // Check if user has voted on proposals
  const checkVotedStatus = async (proposalList) => {
    if (!signer || !account) return;
    
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    const votedMap = {};
    
    for (const proposal of proposalList) {
      try {
        const hasVoted = await contract.hasVoted(proposal.id, account);
        votedMap[proposal.id] = hasVoted;
      } catch (err) {
        votedMap[proposal.id] = false;
      }
    }
    
    setHasVotedMap(votedMap);
  };

  // Cast vote
  const handleVote = async (proposalId, voteType) => {
    if (!signer) {
      alert('Please connect MetaMask first!');
      return;
    }

    setVoting({ ...voting, [proposalId]: true });
    
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const tx = await contract.castVote(proposalId, voteType);
      
      await tx.wait();
      
      alert('Vote cast successfully! 🎉');
      setHasVotedMap({ ...hasVotedMap, [proposalId]: true });
      fetchProposals(); // Refresh data
      
    } catch (err) {
      console.error('Voting failed:', err);
      alert('Voting failed: ' + (err.reason || err.message));
    } finally {
      setVoting({ ...voting, [proposalId]: false });
    }
  };

  // Create proposal
  const createProposal = async () => {
    if (!signer) {
      alert('Connect wallet first!');
      return;
    }
    
    const title = prompt('Enter proposal title:');
    if (!title) return;
    
    const description = prompt('Enter description:');
    if (!description) return;
    
    const duration = 3600; // 1 hour for testing
    
    try {
      const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
      const tx = await contract.createProposal(title, description, '', duration, 0);
      await tx.wait();
      alert('Proposal created!');
      fetchProposals();
    } catch (err) {
      alert('Failed: ' + err.message);
    }
  };

  // Load on mount
  useEffect(() => {
    fetchProposals();
    
    // Auto-connect if already authorized
    if (window.ethereum) {
      window.ethereum.request({ method: 'eth_accounts' }).then((accounts) => {
        if (accounts.length > 0) connectWallet();
      });
    }
  }, []);

  // Re-check votes when account changes
  useEffect(() => {
    if (account && proposals.length > 0) {
      checkVotedStatus(proposals);
    }
  }, [account, proposals.length]);

  const isActive = (proposal) => {
    const now = Math.floor(Date.now() / 1000);
    return proposal.status === 'Active' && now < proposal.endTime;
  };

  if (loading && proposals.length === 0) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontSize: '1.2rem'
      }}>
        Loading...
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
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>
            🗳️ Decentralized Voting
          </h1>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            {account ? (
              <>
                <span style={{ 
                  backgroundColor: '#dcfce7', 
                  color: '#166534',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: 500
                }}>
                  ✅ {account.slice(0,6)}...{account.slice(-4)}
                </span>
                <button 
                  onClick={disconnectWallet}
                  style={{
                    backgroundColor: '#fee2e2',
                    color: '#991b1b',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Disconnect
                </button>
              </>
            ) : (
              <button 
                onClick={connectWallet}
                style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '1rem'
                }}
              >
                🔗 Connect MetaMask
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
            marginBottom: '1rem'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Create Proposal Button */}
        {account && (
          <div style={{ marginBottom: '1.5rem' }}>
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
              ➕ Create New Proposal
            </button>
          </div>
        )}

        {/* Proposals List */}
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {proposals.length === 0 ? (
            <div style={{ 
              backgroundColor: 'white', 
              padding: '3rem', 
              borderRadius: '0.75rem',
              textAlign: 'center',
              color: '#6b7280',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <p style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>
                No proposals found
              </p>
              <p>Connect your wallet and create the first proposal!</p>
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
                  borderLeft: isActive(p) ? '4px solid #10b981' : '4px solid #9ca3af'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ 
                        backgroundColor: isActive(p) ? '#dcfce7' : '#f3f4f6',
                        color: isActive(p) ? '#166534' : '#6b7280',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        {isActive(p) ? '🟢 Active' : '🔴 Ended'}
                      </span>
                      <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                        #{p.id} • Created by {p.creator?.slice(0,6)}...{p.creator?.slice(-4)}
                      </span>
                    </div>
                    
                    <h2 style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: 'bold',
                      margin: '0 0 0.75rem 0',
                      color: '#111827'
                    }}>
                      {p.title}
                    </h2>
                    
                    <p style={{ 
                      color: '#4b5563', 
                      margin: '0 0 1.5rem 0',
                      lineHeight: 1.6,
                      fontSize: '1rem'
                    }}>
                      {p.description}
                    </p>

                    {/* Vote Stats */}
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
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#16a34a' }}>
                          {p.forVotes || 0}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>👍 For</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626' }}>
                          {p.againstVotes || 0}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>👎 Against</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6b7280' }}>
                          {p.abstainVotes || 0}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>😐 Abstain</div>
                      </div>
                    </div>

                    {/* Vote Buttons */}
                    {isActive(p) && account && (
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        {hasVotedMap[p.id] ? (
                          <div style={{
                            backgroundColor: '#dcfce7',
                            color: '#166534',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.5rem',
                            fontWeight: 600
                          }}>
                            ✅ You already voted
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => handleVote(p.id, 1)}
                              disabled={voting[p.id]}
                              style={{
                                flex: 1,
                                backgroundColor: voting[p.id] ? '#d1d5db' : '#16a34a',
                                color: 'white',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                border: 'none',
                                cursor: voting[p.id] ? 'not-allowed' : 'pointer',
                                fontWeight: 600,
                                fontSize: '1rem'
                              }}
                            >
                              {voting[p.id] ? 'Voting...' : '👍 Vote For'}
                            </button>
                            <button
                              onClick={() => handleVote(p.id, 0)}
                              disabled={voting[p.id]}
                              style={{
                                flex: 1,
                                backgroundColor: voting[p.id] ? '#d1d5db' : '#dc2626',
                                color: 'white',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                border: 'none',
                                cursor: voting[p.id] ? 'not-allowed' : 'pointer',
                                fontWeight: 600,
                                fontSize: '1rem'
                              }}
                            >
                              {voting[p.id] ? 'Voting...' : '👎 Vote Against'}
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {!account && isActive(p) && (
                      <div style={{ color: '#6b7280', fontStyle: 'italic' }}>
                        Connect wallet to vote
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}