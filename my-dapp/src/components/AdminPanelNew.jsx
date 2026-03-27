import React, { useState } from 'react';
import { ethers } from 'ethers';
import { useVotingContract } from '../hooks/useVotingContract';

const AdminPanel = () => {
  const { account, addCandidate, registerVoter, loading, error, getAllCandidates } = useVotingContract();
  const [candidateName, setCandidateName] = useState('');
  const [candidateDescription, setCandidateDescription] = useState('');
  const [candidateImageUrl, setCandidateImageUrl] = useState('');
  const [voterAddress, setVoterAddress] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  const getErrorMessage = (err) => {
    if (!err) return 'Transaction failed';
    if (typeof err === 'string') return err;
    if (err.reason) return err.reason;
    if (err.shortMessage) return err.shortMessage;
    if (err.message) return err.message;
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    if (!candidateName.trim()) {
      showMessage('Please enter a candidate name', 'error');
      return;
    }

    const createdName = candidateName;
    const createdDescription = candidateDescription;
    const createdImageUrl = candidateImageUrl;

    try {
      await addCandidate(createdName);
      showMessage(`Candidate "${createdName}" added successfully!`, 'success');

      // Clear inputs immediately.
      setCandidateName('');
      setCandidateDescription('');
      setCandidateImageUrl('');

      // Tell the candidates list to refresh from chain.
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('candidateAdded'));
      }

      // Store extra candidate UI info (off-chain) so the candidate cards can show it.
      // We find the newest candidate matching the name and store metadata by candidateId.
      try {
        const all = await getAllCandidates();
        const created = all
          .filter((c) => c.name === createdName)
          .sort((a, b) => b.id - a.id)[0];

        if (created && typeof window !== 'undefined') {
          const raw = window.localStorage.getItem('candidateMetaV1');
          const meta = raw ? JSON.parse(raw) : {};
          meta[String(created.id)] = {
            description: createdDescription,
            imageUrl: createdImageUrl
          };
          window.localStorage.setItem('candidateMetaV1', JSON.stringify(meta));
        }
      } catch (e2) {
        // Non-critical: candidate metadata is optional for voting.
        console.warn('Failed saving candidate metadata:', e2);
      }
    } catch (err) {
      showMessage(getErrorMessage(err), 'error');
    }
  };

  const handleRegisterVoter = async (e) => {
    e.preventDefault();
    if (!voterAddress.trim()) {
      showMessage('Please enter a voter address', 'error');
      return;
    }

    if (!ethers.isAddress(voterAddress)) {
      showMessage('Invalid Ethereum address', 'error');
      return;
    }

    try {
      await registerVoter(voterAddress);
      showMessage('Voter registered successfully!', 'success');
      setVoterAddress('');
    } catch (err) {
      showMessage(getErrorMessage(err), 'error');
    }
  };

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f9fafb',
      borderRadius: '12px',
      border: '1px solid #e5e7eb'
    }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#111827', fontSize: '18px' }}>
        Admin Panel
      </h3>

      {account && (
        <div style={{
          marginBottom: '20px',
          padding: '12px',
          backgroundColor: '#e0f2fe',
          borderRadius: '8px',
          border: '1px solid #bae6fd'
        }}>
          <div style={{ color: '#075985', fontSize: '14px' }}>
            <strong>Admin Address:</strong> {account.slice(0, 6)}...{account.slice(-4)}
          </div>
        </div>
      )}

      {/* Add Candidate Form */}
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '16px' }}>
          Add Candidate
        </h4>
        <form onSubmit={handleAddCandidate} style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input
              type="text"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="Candidate name (on-chain)"
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />

            <input
              type="text"
              value={candidateImageUrl}
              onChange={(e) => setCandidateImageUrl(e.target.value)}
              placeholder="Candidate image URL (optional)"
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />

            <textarea
              value={candidateDescription}
              onChange={(e) => setCandidateDescription(e.target.value)}
              placeholder="Short description / manifesto (optional)"
              disabled={loading}
              rows={3}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !candidateName.trim()}
            style={{
              padding: '10px 20px',
              height: 'fit-content',
              backgroundColor: loading ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading || !candidateName.trim() ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {loading ? 'Adding...' : 'Add Candidate'}
          </button>
        </form>
      </div>

      {/* Register Voter Form */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '16px' }}>
          Register Voter
        </h4>
        <form onSubmit={handleRegisterVoter} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={voterAddress}
            onChange={(e) => setVoterAddress(e.target.value)}
            placeholder="Enter voter address (0x...)"
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: 'monospace'
            }}
          />
          <button
            type="submit"
            disabled={loading || !voterAddress.trim()}
            style={{
              padding: '10px 20px',
              backgroundColor: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: loading || !voterAddress.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Registering...' : 'Register Voter'}
          </button>
        </form>
      </div>

      {/* Message Display */}
      {message && (
        <div style={{
          padding: '12px',
          borderRadius: '6px',
          border: `1px solid ${messageType === 'success' ? '#10b981' : '#ef4444'}`,
          backgroundColor: messageType === 'success' ? '#d1fae5' : '#fef2f2'
        }}>
          <div style={{ 
            color: messageType === 'success' ? '#065f46' : '#991b1b',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {messageType === 'success' ? '✅' : '❌'} {message}
          </div>
        </div>
      )}

      {/* Low-level error from hook (e.g. revert reason) */}
      {error && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          borderRadius: '8px',
          border: '1px solid #fecaca',
          backgroundColor: '#fef2f2',
          color: '#991b1b',
          fontSize: '13px',
          textAlign: 'center'
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Instructions */}
      <div style={{
        marginTop: '20px',
        padding: '12px',
        backgroundColor: '#fef3c7',
        borderRadius: '6px',
        border: '1px solid #fde68a'
      }}>
        <div style={{ color: '#92400e', fontSize: '12px' }}>
          <strong>Instructions:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            <li>Add candidates before starting voting</li>
            <li>Register voter addresses to allow voting</li>
            <li>Make sure you're the contract owner</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
