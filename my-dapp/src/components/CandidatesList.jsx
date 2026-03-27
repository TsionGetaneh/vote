import React, { useState, useEffect } from 'react';
import { useVotingContract } from '../hooks/useVotingContract';

const CandidatesList = () => {
  const {
    getAllCandidates,
    vote,
    hasVoterVoted,
    isVoterRegistered,
    getVotingStatus,
    account,
    loading,
    error,
    clearError
  } = useVotingContract();
  const [candidates, setCandidates] = useState([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [votingStatus, setVotingStatus] = useState('Loading...');
  const [votingLoading, setVotingLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [profileCandidateId, setProfileCandidateId] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [profileDescription, setProfileDescription] = useState('');
  const [profileWallet, setProfileWallet] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);

  // Refresh the list after admin actions that update candidates on-chain.
  useEffect(() => {
    const handler = () => setRefreshKey((prev) => prev + 1);
    window.addEventListener('candidateAdded', handler);
    return () => window.removeEventListener('candidateAdded', handler);
  }, []);

  useEffect(() => {
    const fetchCandidates = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching candidates...');
        const candidatesData = await getAllCandidates();
        console.log('Candidates data:', candidatesData);
        setCandidates(candidatesData);

        // Voting status is independent of the connected account.
        const status = await getVotingStatus();
        setVotingStatus(status);

        if (account) {
          const voted = await hasVoterVoted();
          setHasVoted(voted);

          const registered = await isVoterRegistered();
          setIsRegistered(registered);
        }
      } catch (error) {
        console.error('Error fetching candidates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCandidates();
  }, [getAllCandidates, hasVoterVoted, isVoterRegistered, getVotingStatus, account, refreshKey]);

  const handleVote = async (candidateId) => {
    if (hasVoted) return;
    
    setVotingLoading(true);
    clearError();
    try {
      await vote(candidateId);
      setHasVoted(true);
      setRefreshKey(prev => prev + 1); // Refresh candidates list
    } finally {
      setVotingLoading(false);
    }
  };

  const getTotalVotes = () => {
    return candidates.reduce((total, candidate) => total + candidate.voteCount, 0);
  };

  const getVotePercentage = (votes) => {
    const total = getTotalVotes();
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  const saveCandidateProfile = async (e) => {
    e.preventDefault();
    setProfileMessage('');

    const id = Number(profileCandidateId);
    if (!Number.isFinite(id) || id < 0) {
      setProfileMessage('Invalid candidate ID');
      return;
    }

    if (typeof window === 'undefined') return;

    setProfileSaving(true);
    try {
      const key = 'candidateMetaV1';
      const raw = window.localStorage.getItem(key);
      const meta = raw ? JSON.parse(raw) : {};

      meta[String(id)] = {
        ...(meta[String(id)] || {}),
        imageUrl: profileImageUrl.trim(),
        description: profileDescription.trim(),
        walletAddress: profileWallet.trim()
      };

      window.localStorage.setItem(key, JSON.stringify(meta));
      setProfileMessage('Saved candidate profile info');

      // Refresh UI from latest localStorage meta.
      setRefreshKey((prev) => prev + 1);

      setProfileCandidateId('');
      setProfileImageUrl('');
      setProfileDescription('');
      setProfileWallet('');
    } catch (err) {
      setProfileMessage('Failed to save profile');
    } finally {
      setProfileSaving(false);
      setTimeout(() => setProfileMessage(''), 3000);
    }
  };

  if (isLoading) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        textAlign: 'center',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ color: '#6b7280' }}>Loading candidates...</div>
      </div>
    );
  }

  if (candidates.length === 0) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        textAlign: 'center',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#111827', fontSize: '18px' }}>
          Candidates
        </h3>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
          Status: {votingStatus}
        </div>

        {error && (
          <div style={{
            marginBottom: '12px',
            padding: '12px',
            backgroundColor: '#fef2f2',
            borderRadius: '8px',
            border: '1px solid #fecaca',
            color: '#dc2626',
            fontSize: '14px',
            textAlign: 'center'
          }}>
            ⚠️ {error}
          </div>
        )}

        <p style={{ color: '#6b7280', margin: 0 }}>
          No candidates available yet. Ask the admin to add candidates.
        </p>
        <button
          onClick={() => setRefreshKey(prev => prev + 1)}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          🔄 Refresh
        </button>
      </div>
    );
  }

  const isVotingActive = votingStatus === 'Active' || votingStatus === 'Ongoing';
  const isVotingExplicitlyInactive = !isVotingActive && votingStatus !== 'Unknown' && votingStatus !== 'Loading...';

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f9fafb',
      borderRadius: '12px',
      border: '1px solid #e5e7eb'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#111827', fontSize: '18px' }}>
          🗳️ Candidates ({candidates.length})
        </h3>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            Total Votes: {getTotalVotes()}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', whiteSpace: 'nowrap' }}>
            Status: {votingStatus}
          </div>
          <button
            onClick={() => setRefreshKey(prev => prev + 1)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#e5e7eb',
              color: '#374151',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          marginBottom: '12px',
          padding: '12px',
          backgroundColor: '#fef2f2',
          borderRadius: '8px',
          border: '1px solid #fecaca',
          color: '#dc2626',
          fontSize: '14px',
          textAlign: 'center'
        }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {candidates.map((candidate, index) => (
          <div
            key={candidate.id}
            style={{
              padding: '16px',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              transition: 'all 0.2s',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ flex: 1, display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '12px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #e5e7eb',
                    overflow: 'hidden',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {candidate.imageUrl ? (
                    <img
                      src={candidate.imageUrl}
                      alt={candidate.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <span style={{ color: '#9ca3af', fontWeight: '700' }}>🗳️</span>
                  )}
                </div>

                <div style={{ minWidth: 0 }}>
                  <h4 style={{ margin: '0 0 6px 0', color: '#111827', fontSize: '16px', fontWeight: '600' }}>
                    #{candidate.id} {candidate.name}
                  </h4>
                  {candidate.description && (
                    <div style={{ color: '#6b7280', fontSize: '13px', lineHeight: '1.3', marginBottom: '6px' }}>
                      {candidate.description}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ color: '#6b7280', fontSize: '14px' }}>
                      🗳️ Votes: <strong>{candidate.voteCount}</strong>
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '14px' }}>
                      📊 {getVotePercentage(candidate.voteCount)}%
                    </div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleVote(candidate.id)}
                disabled={isVotingExplicitlyInactive || hasVoted || votingLoading || loading}
                style={{
                  padding: '10px 20px',
                  backgroundColor: (isVotingExplicitlyInactive || hasVoted) ? '#d1d5db' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: (isVotingExplicitlyInactive || hasVoted) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: hasVoted ? 'none' : '0 2px 4px rgba(16, 185, 129, 0.2)'
                }}
              >
                {hasVoted
                  ? '✅ Voted'
                  : !isVotingActive && isVotingExplicitlyInactive
                    ? `⏳ Voting: ${votingStatus}`
                    : votingLoading
                      ? '🔄 Voting...'
                      : !isRegistered
                        ? '🗳️ Vote (check registration)'
                        : '🗳️ Vote'}
              </button>
            </div>

            {/* Progress bar */}
            <div style={{
              width: '100%',
              height: '12px',
              backgroundColor: '#f3f4f6',
              borderRadius: '6px',
              overflow: 'hidden',
              border: '1px solid #e5e7eb'
            }}>
              <div
                style={{
                  width: `${getVotePercentage(candidate.voteCount)}%`,
                  height: '100%',
                  backgroundColor: '#10b981',
                  transition: 'width 0.5s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: '8px'
                }}
              >
                {getVotePercentage(candidate.voteCount) > 10 && (
                  <span style={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>
                    {getVotePercentage(candidate.voteCount)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasVoted && (
        <div style={{
          marginTop: '16px',
          padding: '16px',
          backgroundColor: '#dcfce7',
          borderRadius: '8px',
          border: '1px solid #bbf7d0',
          textAlign: 'center'
        }}>
          <div style={{ color: '#166534', fontWeight: '600', fontSize: '16px' }}>
            ✅ You have successfully cast your vote!
          </div>
          <div style={{ color: '#166534', fontSize: '14px', marginTop: '4px' }}>
            Thank you for participating in the democratic process.
          </div>
        </div>
      )}

      {/* Voting Statistics */}
      {getTotalVotes() > 0 && (
        <div style={{
          marginTop: '16px',
          padding: '16px',
          backgroundColor: '#eff6ff',
          borderRadius: '8px',
          border: '1px solid #dbeafe'
        }}>
          <h4 style={{ margin: '0 0 12px 0', color: '#1e40af', fontSize: '14px', fontWeight: '600' }}>
            📊 Voting Statistics
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e40af' }}>
                {candidates.length}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Candidates</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e40af' }}>
                {getTotalVotes()}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Total Votes</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1e40af' }}>
                {candidates.length > 0 ? Math.round(getTotalVotes() / candidates.length) : 0}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Avg Votes</div>
            </div>
          </div>
        </div>
      )}

      <div style={{
        marginTop: '16px',
        padding: '16px',
        backgroundColor: 'white',
        borderRadius: '10px',
        border: '1px solid #e5e7eb'
      }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#111827', fontSize: '14px', fontWeight: '700' }}>
          Candidate Profile (off-chain)
        </h4>
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '10px' }}>
          This updates only the candidate card image/description in your browser. Vote counts stay on-chain.
        </div>

        <form onSubmit={saveCandidateProfile} style={{ display: 'grid', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              value={profileCandidateId}
              onChange={(e) => setProfileCandidateId(e.target.value)}
              placeholder="Candidate ID (e.g. 0)"
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />
            <input
              value={profileWallet}
              onChange={(e) => setProfileWallet(e.target.value)}
              placeholder="Wallet (optional)"
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'monospace'
              }}
            />
          </div>

          <input
            value={profileImageUrl}
            onChange={(e) => setProfileImageUrl(e.target.value)}
            placeholder="Image URL (optional)"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          />

          <textarea
            value={profileDescription}
            onChange={(e) => setProfileDescription(e.target.value)}
            placeholder="Description / manifesto (optional)"
            rows={3}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />

          <button
            type="submit"
            disabled={profileSaving}
            style={{
              padding: '10px 14px',
              backgroundColor: profileSaving ? '#9ca3af' : '#8b5cf6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: profileSaving ? 'not-allowed' : 'pointer'
            }}
          >
            {profileSaving ? 'Saving...' : 'Save Profile Info'}
          </button>

          {profileMessage && (
            <div style={{
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              color: '#111827',
              fontSize: '13px',
              textAlign: 'center'
            }}>
              {profileMessage}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CandidatesList;
