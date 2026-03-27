import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import ConnectWallet from "./components/connectWallet";
import VoterRegistration from "./components/VoterRegistration";
import ProposalForm from "./components/ProposalForm";
import AdminPanel from "./components/AdminPanel";
import ProposalList from "./components/ProposalList";
import "./index.css";

const Web3Context = createContext();

const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    console.log('Connect wallet called');
    
    if (typeof window.ethereum === 'undefined') {
      console.log('MetaMask not installed');
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('Requesting accounts...');

      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log('Accounts received:', accounts);
      
      if (accounts.length === 0) {
        setError('No accounts found. Please connect an account in MetaMask.');
        return;
      }

      console.log('Creating provider...');
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const address = await signer.getAddress();
      console.log('Address:', address);

      setProvider(provider);
      setAccount(address);
      console.log('Wallet connected successfully!');
      
    } catch (err) {
      console.error('Connection error:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setContract(null);
    setError(null);
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            setProvider(provider);
            setAccount(accounts[0]);
          }
        } catch (err) {
          console.error('Error checking connection:', err);
        }
      }
    };

    checkConnection();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAccount(accounts[0]);
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, []);

  const value = {
    account,
    provider,
    contract,
    error,
    loading,
    connectWallet,
    disconnectWallet
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

export { useWeb3, Web3Provider };

const AppContent = () => {
  const { account, error } = useWeb3();

  return (
    <div style={{ minHeight: '100vh', padding: '20px', backgroundColor: '#f5f5f5' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#333', marginBottom: '20px' }}>Secure Voting DApp</h1>
        <ConnectWallet />
      </header>
      <main>
        {error && (
          <div style={{ 
            color: 'red', 
            textAlign: 'center', 
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#ffebee',
            borderRadius: '8px',
            border: '1px solid #ffcdd2'
          }}>
            <strong>Error:</strong> {error}
            <br />
            <small>Check browser console (F12) for more details</small>
          </div>
        )}
        {account ? (
          <div style={{ display: 'grid', gap: '20px' }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <VoterRegistration />
            </div>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <ProposalForm />
            </div>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <AdminPanel />
            </div>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <ProposalList />
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h2 style={{ color: '#666', marginBottom: '20px' }}>Welcome to Secure Voting DApp</h2>
            <p style={{ color: '#888', fontSize: '18px' }}>Please connect your wallet to access voting features</p>
          </div>
        )}
      </main>
    </div>
  );
};

function App() {
  return (
    <Web3Provider>
      <AppContent />
    </Web3Provider>
  );
}

export default App;
