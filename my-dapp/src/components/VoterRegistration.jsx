import React from 'react';
import { useWeb3 } from '../App';

const VoterRegistration = () => {
  const { account } = useWeb3();

  return (
    <div>
      <h2 style={{ color: '#333', marginBottom: '15px' }}>Voter Registration</h2>
      <p style={{ color: '#666', marginBottom: '10px' }}>
        Connected Account: {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Not connected'}
      </p>
      <div style={{ 
        padding: '15px', 
        backgroundColor: '#e8f4fd', 
        borderRadius: '6px',
        border: '1px solid #bee5eb'
      }}>
        <p style={{ margin: 0, color: '#0c5460' }}>
          Registration status: Ready to vote
        </p>
      </div>
    </div>
  );
};

export default VoterRegistration;
