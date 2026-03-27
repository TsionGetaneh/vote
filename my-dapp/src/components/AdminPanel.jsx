import React from 'react';
import { useWeb3 } from '../App';

const AdminPanel = () => {
  const { account } = useWeb3();

  return (
    <div>
      <h2 style={{ color: '#333', marginBottom: '15px' }}>Admin Panel</h2>
      <div style={{ 
        padding: '15px', 
        backgroundColor: '#fff3cd', 
        borderRadius: '6px',
        border: '1px solid #ffeaa7'
      }}>
        <p style={{ margin: 0, color: '#856404' }}>
          Admin functions available for contract management
        </p>
      </div>
      <div style={{ marginTop: '15px' }}>
        <p style={{ color: '#666' }}>
          Connected: {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'Not connected'}
        </p>
      </div>
    </div>
  );
};

export default AdminPanel;
