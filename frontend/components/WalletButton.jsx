'use client';

import { useWallet } from '@/hooks/useWallet';
import { Loader2, Wallet } from 'lucide-react';

export const WalletButton = () => {
  const { account, isConnected, isConnecting, connect, disconnect } = useWallet();

  const formatAddress = (addr) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnecting) {
    return (
      <button disabled className="flex items-center gap-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-lg">
        <Loader2 size={16} className="animate-spin" />
        Connecting...
      </button>
    );
  }

  if (isConnected) {
    return (
      <button
        onClick={disconnect}
        className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors border border-green-200"
      >
        <Wallet size={16} />
        {formatAddress(account)}
      </button>
    );
  }

  return (
    <button
      onClick={connect}
      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
    >
      <Wallet size={16} />
      Connect Wallet
    </button>
  );
};