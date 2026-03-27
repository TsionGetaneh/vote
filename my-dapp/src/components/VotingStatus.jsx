import React, { useState, useEffect } from 'react';
import { useVotingContract } from '../hooks/useVotingContract';

const VotingStatus = () => {
  const { getVotingStatus, getWinner } = useVotingContract();
  const [status, setStatus] = useState('Loading...');
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const votingStatus = await getVotingStatus();
        setStatus(votingStatus);
        
        if (votingStatus === 'Ended') {
          const winnerData = await getWinner();
          setWinner(winnerData);
        }
      } catch (error) {
        console.error('Error fetching voting status:', error);
        setStatus('Error');
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [getVotingStatus, getWinner]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Not Started': return '#6b7280';
      case 'Active': return '#10b981';
      case 'Ended': return '#ef4444';
      case 'Scheduled': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Not Started': return '⏳';
      case 'Active': return '🗳️';
      case 'Ended': return '✅';
      case 'Scheduled': return '📅';
      default: return '❓';
    }
  };

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        textAlign: 'center',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ color: '#6b7280' }}>Loading voting status...</div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      backgroundColor: '#f9fafb',
      borderRadius: '12px',
      border: '1px solid #e5e7eb'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#111827', fontSize: '18px' }}>
        Voting Status
      </h3>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '15px',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: `2px solid ${getStatusColor(status)}`
      }}>
        <span style={{ fontSize: '24px' }}>{getStatusIcon(status)}</span>
        <div>
          <div style={{ 
            fontWeight: 'bold', 
            color: getStatusColor(status),
            fontSize: '16px'
          }}>
            {status}
          </div>
          {status === 'Active' && (
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Voting is currently in progress
            </div>
          )}
          {status === 'Not Started' && (
            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Waiting for admin to start voting
            </div>
          )}
        </div>
      </div>

      {winner && (
        <div style={{
          marginTop: '15px',
          padding: '15px',
          backgroundColor: '#dcfce7',
          borderRadius: '8px',
          border: '1px solid #bbf7d0'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#166534', fontSize: '16px' }}>
            🏆 Election Results
          </h4>
          <div style={{ color: '#166534' }}>
            <strong>Winner:</strong> {winner.name}
          </div>
          <div style={{ color: '#166534' }}>
            <strong>Votes:</strong> {winner.votes}
          </div>
        </div>
      )}
    </div>
  );
};

export default VotingStatus;
