import { ethers } from 'ethers';
import abi from './abi.json';

const CONTRACT_ADDRESS = '0xE94c79509CDdCf86f2b501f8E96E6019C50eDfc2';

export const getContract = async () => {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed');
  }

  await window.ethereum.request({ method: 'eth_requestAccounts' });
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  return new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
};

export const getReadOnlyContract = () => {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('MetaMask is not installed');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  return new ethers.Contract(CONTRACT_ADDRESS, abi, provider);
};

export { CONTRACT_ADDRESS };
