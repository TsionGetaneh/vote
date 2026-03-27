import React from 'react';
import WalletConnect from './components/WalletConnect';
import VotingStatus from './components/VotingStatus';
import CandidatesList from './components/CandidatesList';
import AdminPanel from './components/AdminPanelNew';
import VoterRegistration from './components/VoterReg';
import './index.css';

function App() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '20px'
    }}>
      {/* Header */}
      <header style={{
        textAlign: 'center',
        marginBottom: '40px',
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{
          margin: '0 0 10px 0',
          color: '#111827',
          fontSize: '32px',
          fontWeight: 'bold'
        }}>
          🗳️ Secure Voting DApp
        </h1>
        <p style={{
          margin: 0,
          color: '#6b7280',
          fontSize: '16px'
        }}>
          Decentralized voting system powered by blockchain
        </p>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '20px'
      }}>
        {/* Wallet Connection */}
        <div style={{ gridColumn: '1 / -1' }}>
          <WalletConnect />
        </div>

        {/* Voting Status */}
        <VotingStatus />

        {/* Voter Registration */}
        <VoterRegistration />

        {/* Admin Panel */}
        <AdminPanel />

        {/* Candidates List */}
        <div style={{ gridColumn: '1 / -1' }}>
          <CandidatesList />
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        marginTop: '40px',
        padding: '20px',
        color: '#6b7280',
        fontSize: '14px'
      }}>
        <p style={{ margin: 0 }}>
          Built with React, Ethereum, and Solidity
        </p>
        <p style={{ margin: '8px 0 0 0' }}>
          Contract: 0x831326c771583215f7C6A3b743Cf2ffF94Ff626e
        </p>
        <p style={{ margin: '8px 0 0 0', fontSize: '12px' }}>
          🚀 Features: Real-time voting • Admin panel • Voter registration • Live results
        </p>
      </footer>
    </div>
  );
}

export default App;
