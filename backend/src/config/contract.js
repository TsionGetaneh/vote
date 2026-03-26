import { ethers } from 'ethers';

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '0x9ccF3d67acECa28D898B346FCd3DABF24ec1A442';

// Reliable public RPC endpoints for Sepolia testnet
const RPC_URLS = [
  'https://ethereum-sepolia-rpc.publicnode.com',
  'https://sepolia.drpc.org',
  'https://rpc.sepolia.org',
  'https://sepolia.gateway.tenderly.co'
];

// Use env var or first fallback
const RPC_URL = process.env.RPC_URL || RPC_URLS[0];

// Complete ABI from your contract
const abi = [
  {
    "inputs": [{ "internalType": "uint256", "name": "_proposalId", "type": "uint256" }],
    "name": "getProposal",
    "outputs": [{
      "components": [
        { "internalType": "uint256", "name": "id", "type": "uint256" },
        { "internalType": "string", "name": "title", "type": "string" },
        { "internalType": "string", "name": "description", "type": "string" },
        { "internalType": "string", "name": "ipfsHash", "type": "string" },
        { "internalType": "address", "name": "creator", "type": "address" },
        { "internalType": "uint256", "name": "startTime", "type": "uint256" },
        { "internalType": "uint256", "name": "endTime", "type": "uint256" },
        { "internalType": "uint256", "name": "forVotes", "type": "uint256" },
        { "internalType": "uint256", "name": "againstVotes", "type": "uint256" },
        { "internalType": "uint256", "name": "abstainVotes", "type": "uint256" },
        { "internalType": "uint8", "name": "status", "type": "uint8" },
        { "internalType": "uint256", "name": "totalVotes", "type": "uint256" }
      ],
      "internalType": "struct DecentralizedVoting.ProposalView",
      "name": "",
      "type": "tuple"
    }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_startId", "type": "uint256" },
      { "internalType": "uint256", "name": "_count", "type": "uint256" }
    ],
    "name": "getProposalsBatch",
    "outputs": [{
      "components": [
        { "internalType": "uint256", "name": "id", "type": "uint256" },
        { "internalType": "string", "name": "title", "type": "string" },
        { "internalType": "string", "name": "description", "type": "string" },
        { "internalType": "string", "name": "ipfsHash", "type": "string" },
        { "internalType": "address", "name": "creator", "type": "address" },
        { "internalType": "uint256", "name": "startTime", "type": "uint256" },
        { "internalType": "uint256", "name": "endTime", "type": "uint256" },
        { "internalType": "uint256", "name": "forVotes", "type": "uint256" },
        { "internalType": "uint256", "name": "againstVotes", "type": "uint256" },
        { "internalType": "uint256", "name": "abstainVotes", "type": "uint256" },
        { "internalType": "uint8", "name": "status", "type": "uint8" },
        { "internalType": "uint256", "name": "totalVotes", "type": "uint256" }
      ],
      "internalType": "struct DecentralizedVoting.ProposalView[]",
      "name": "",
      "type": "tuple[]"
    }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "_proposalId", "type": "uint256" }],
    "name": "getResults",
    "outputs": [
      { "internalType": "uint256", "name": "forVotes", "type": "uint256" },
      { "internalType": "uint256", "name": "againstVotes", "type": "uint256" },
      { "internalType": "uint256", "name": "abstainVotes", "type": "uint256" },
      { "internalType": "uint256", "name": "totalVotes", "type": "uint256" },
      { "internalType": "uint256", "name": "forPercentage", "type": "uint256" },
      { "internalType": "uint256", "name": "againstPercentage", "type": "uint256" },
      { "internalType": "uint256", "name": "abstainPercentage", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "proposalCounter",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "_user", "type": "address" }],
    "name": "getUserVotingHistory",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "proposalId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "voter", "type": "address" },
      { "indexed": false, "internalType": "uint8", "name": "voteType", "type": "uint8" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "VoteCast",
    "type": "event"
  }
];

let provider;
let contract;

export const getProvider = () => {
  if (!provider) {
    try {
      provider = new ethers.JsonRpcProvider(RPC_URL);
      console.log(`✅ Connected to RPC: ${RPC_URL}`);
    } catch (error) {
      console.error(`❌ Failed to connect to RPC: ${RPC_URL}`);
      throw error;
    }
  }
  return provider;
};

export const getContract = () => {
  if (!contract) {
    contract = new ethers.Contract(CONTRACT_ADDRESS, abi, getProvider());
  }
  return contract;
};

export { CONTRACT_ADDRESS, abi, RPC_URL };