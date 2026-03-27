import React from 'react';
import { useVotingContract } from '../hooks/useVotingContract';

const WalletConnect = () => {
  const { account, connectWallet, loading, error, isConnected, clearError } = useVotingContract();

  const handleConnect = async () => {
    clearError();
    await connectWallet();
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
      {isConnected ? (
        <div style={{ 
          padding: '12px 24px', 
          backgroundColor: '#10b981', 
          color: 'white', 
          borderRadius: '12px',
          fontWeight: 'bold',
          fontSize: '16px',
          boxShadow: '0 4px 6px rgba(16, 185, 129, 0.1)'
        }}>
          ✅ Connected: {formatAddress(account)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={handleConnect} 
            disabled={loading}
            style={{
              padding: '14px 28px',
              backgroundColor: loading ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: loading ? 'none' : '0 4px 6px rgba(59, 130, 246, 0.1)'
            }}
          >
            {loading ? '🔄 Connecting...' : '🦊 Connect Wallet'}
          </button>
          
          {typeof window.ethereum === 'undefined' && (
            <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#fef2f2', borderRadius: '8px' }}>
              <p style={{ color: '#ef4444', margin: '0 0 10px 0', fontWeight: '600' }}>
                MetaMask not detected
              </p>
              <button
                onClick={() => window.open('https://metamask.io/download/', '_blank')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Install MetaMask
              </button>
            </div>
          )}
        </div>
      )}
      
      {error && (
        <div style={{ 
          color: '#dc2626', 
          fontSize: '14px',
          textAlign: 'center',
          maxWidth: '350px',
          padding: '12px',
          backgroundColor: '#fef2f2',
          borderRadius: '8px',
          border: '1px solid #fecaca'
        }}>
          ⚠️ {error}
        </div>
      )}
      
      {!isConnected && (
        <div style={{ fontSize: '12px', color: '#6b7280', textAlign: 'center' }}>
          <p>Connect your wallet to start voting</p>
        </div>
      )}
    </div>
  );
};

export default WalletConnect;
