import React from 'react';
import { useWeb3 } from '../App';

const ConnectWallet = () => {
  const { account, connectWallet, loading, error } = useWeb3();

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (err) {
      console.error('Connection failed:', err);
    }
  };

  const handleInstallMetaMask = () => {
    window.open('https://metamask.io/download/', '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
      {account ? (
        <div style={{ 
          padding: '10px 20px', 
          backgroundColor: '#4CAF50', 
          color: 'white', 
          borderRadius: '8px',
          fontWeight: 'bold'
        }}>
          ✅ Connected: {account.slice(0, 6)}...{account.slice(-4)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={handleConnect} 
            disabled={loading}
            style={{
              padding: '12px 24px',
              backgroundColor: loading ? '#ccc' : '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {loading ? '🔄 Connecting...' : '🦊 Connect Wallet'}
          </button>
          
          {typeof window.ethereum === 'undefined' && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#ff6b6b', margin: '0 0 10px 0' }}>
                MetaMask not detected
              </p>
              <button
                onClick={handleInstallMetaMask}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ff6b6b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer'
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
          color: 'red', 
          fontSize: '14px',
          textAlign: 'center',
          maxWidth: '300px',
          padding: '10px',
          backgroundColor: '#ffebee',
          borderRadius: '6px',
          border: '1px solid #ffcdd2'
        }}>
          ⚠️ {error}
        </div>
      )}
      
      <div style={{ fontSize: '12px', color: '#666', textAlign: 'center' }}>
        <p>Need help? Press F12 and check Console</p>
      </div>
    </div>
  );
};

export default ConnectWallet;
