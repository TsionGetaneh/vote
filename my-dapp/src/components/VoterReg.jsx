import React, { useState, useEffect } from 'react';
import { useVotingContract } from '../hooks/useVotingContract';

const VoterRegistration = () => {
  const { account, isVoterRegistered, registerVoter, loading } = useVotingContract();
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selfRegisterAddress, setSelfRegisterAddress] = useState('');

  useEffect(() => {
    const checkRegistration = async () => {
      if (account) {
        const registered = await isVoterRegistered(account);
        setIsRegistered(registered);
      }
    };

    checkRegistration();
  }, [account, isVoterRegistered]);

  const handleSelfRegister = async (e) => {
    e.preventDefault();
    if (!selfRegisterAddress.trim()) {
      setMessage('Please enter your address');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setRegistrationLoading(true);
    try {
      await registerVoter(selfRegisterAddress);
      setMessage('✅ Registration successful!');
      if (selfRegisterAddress.toLowerCase() === account?.toLowerCase()) {
        setIsRegistered(true);
      }
      setSelfRegisterAddress('');
    } catch (err) {
      const msg = err?.reason || err?.shortMessage || err?.message || '❌ Registration failed';
      setMessage(msg);
    } finally {
      setTimeout(() => setMessage(''), 3000);
      setRegistrationLoading(false);
    }
  };

  const handleQuickRegister = async () => {
    if (!account) {
      setMessage('Please connect your wallet first');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setRegistrationLoading(true);
    try {
      await registerVoter(account);
      setMessage('✅ Successfully registered to vote!');
      setIsRegistered(true);
    } catch (err) {
      const msg = err?.reason || err?.shortMessage || err?.message || '❌ Registration failed';
      setMessage(msg);
    } finally {
      setTimeout(() => setMessage(''), 3000);
      setRegistrationLoading(false);
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
        🆔 Voter Registration
      </h3>

      {/* Registration Status */}
      {account && (
        <div style={{
          marginBottom: '20px',
          padding: '12px',
          backgroundColor: isRegistered ? '#dcfce7' : '#fef3c7',
          borderRadius: '8px',
          border: `1px solid ${isRegistered ? '#bbf7d0' : '#fde68a'}`
        }}>
          <div style={{ 
            color: isRegistered ? '#166534' : '#92400e',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            {isRegistered ? '✅ Registered to Vote' : '⚠️ Not Registered'}
          </div>
          <div style={{ 
            color: isRegistered ? '#166534' : '#92400e',
            fontSize: '12px',
            marginTop: '4px'
          }}>
            Address: {account.slice(0, 6)}...{account.slice(-4)}
          </div>
        </div>
      )}

      {/* Quick Register Button */}
      {account && !isRegistered && (
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={handleQuickRegister}
            disabled={registrationLoading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: registrationLoading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: registrationLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {registrationLoading ? '🔄 Registering...' : '🚀 Register Me to Vote'}
          </button>
        </div>
      )}

      {/* Manual Registration Form */}
      <div>
        <h4 style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '16px' }}>
          Register Any Address
        </h4>
        <form onSubmit={handleSelfRegister} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            value={selfRegisterAddress}
            onChange={(e) => setSelfRegisterAddress(e.target.value)}
            placeholder="Enter address to register (0x...)"
            disabled={registrationLoading}
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
            disabled={registrationLoading || !selfRegisterAddress.trim()}
            style={{
              padding: '10px 20px',
              backgroundColor: registrationLoading ? '#9ca3af' : '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: registrationLoading || !selfRegisterAddress.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            {registrationLoading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>

      {/* Message Display */}
      {message && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          borderRadius: '6px',
          backgroundColor: message.includes('✅') ? '#dcfce7' : '#fef2f2',
          border: `1px solid ${message.includes('✅') ? '#bbf7d0' : '#fecaca'}`
        }}>
          <div style={{ 
            color: message.includes('✅') ? '#166534' : '#991b1b',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {message}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{
        marginTop: '20px',
        padding: '12px',
        backgroundColor: '#f3f4f6',
        borderRadius: '6px',
        border: '1px solid #d1d5db'
      }}>
        <div style={{ color: '#6b7280', fontSize: '12px' }}>
          <strong>📋 Registration Info:</strong>
          <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
            <li>You must be registered to vote</li>
            <li>Only admin can register voters</li>
            <li>Quick register uses your connected wallet</li>
            <li>Manual register for any address (admin only)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VoterRegistration;
