import { ethers } from 'ethers';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x9ccF3d67acECa28D898B346FCd3DABF24ec1A442';

const ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "_proposalId", "type": "uint256" },
      { "internalType": "enum DecentralizedVoting.VoteType", "name": "_voteType", "type": "uint8" }
    ],
    "name": "castVote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "_title", "type": "string" },
      { "internalType": "string", "name": "_description", "type": "string" },
      { "internalType": "string", "name": "_ipfsHash", "type": "string" },
      { "internalType": "uint256", "name": "_duration", "type": "uint256" },
      { "internalType": "uint256", "name": "_delay", "type": "uint256" }
    ],
    "name": "createProposal",
    "outputs": [{ "internalType": "uint256", "name": "proposalId", "type": "uint256" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
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
        { "internalType": "enum DecentralizedVoting.ProposalStatus", "name": "status", "type": "uint8" },
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
    "inputs": [
      { "internalType": "uint256", "name": "_proposalId", "type": "uint256" },
      { "internalType": "address", "name": "_voter", "type": "address" }
    ],
    "name": "hasVoted",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      { "indexed": true, "internalType": "uint256", "name": "proposalId", "type": "uint256" },
      { "indexed": true, "internalType": "address", "name": "voter", "type": "address" },
      { "indexed": false, "internalType": "enum DecentralizedVoting.VoteType", "name": "voteType", "type": "uint8" },
      { "indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256" }
    ],
    "name": "VoteCast",
    "type": "event"
  }
];

export const getContract = (providerOrSigner) => {
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, providerOrSigner);
};

export { CONTRACT_ADDRESS, ABI };