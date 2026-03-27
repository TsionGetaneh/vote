import React from 'react';
import { useWeb3 } from '../App';

const ProposalList = () => {
  const { account } = useWeb3();

  // Mock proposals data
  const mockProposals = [
    { id: 1, title: "Improve Security", status: "Active" },
    { id: 2, title: "Add New Features", status: "Pending" },
    { id: 3, title: "Update Protocol", status: "Completed" }
  ];

  return (
    <div>
      <h2 style={{ color: '#333', marginBottom: '15px' }}>Active Proposals</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {mockProposals.map(proposal => (
          <div 
            key={proposal.id}
            style={{
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              border: '1px solid #dee2e6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <h4 style={{ margin: 0, color: '#495057' }}>{proposal.title}</h4>
              <span style={{
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: proposal.status === 'Active' ? '#d4edda' : 
                                 proposal.status === 'Pending' ? '#fff3cd' : '#d1ecf1',
                color: proposal.status === 'Active' ? '#155724' : 
                       proposal.status === 'Pending' ? '#856404' : '#0c5460'
              }}>
                {proposal.status}
              </span>
            </div>
            <button
              style={{
                padding: '6px 12px',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Vote
            </button>
          </div>
        ))}
      </div>
      {mockProposals.length === 0 && (
        <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
          No proposals available
        </p>
      )}
    </div>
  );
};

export default ProposalList;
