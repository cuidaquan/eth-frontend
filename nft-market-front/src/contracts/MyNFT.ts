export const MyNFTABI = [
  {
    "type": "function",
    "name": "approve",
    "inputs": [
      {"name": "to", "type": "address", "internalType": "address"},
      {"name": "tokenId", "type": "uint256", "internalType": "uint256"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "setApprovalForAll",
    "inputs": [
      {"name": "operator", "type": "address", "internalType": "address"},
      {"name": "approved", "type": "bool", "internalType": "bool"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "ownerOf",
    "inputs": [
      {"name": "tokenId", "type": "uint256", "internalType": "uint256"}
    ],
    "outputs": [
      {"name": "", "type": "address", "internalType": "address"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getApproved",
    "inputs": [
      {"name": "tokenId", "type": "uint256", "internalType": "uint256"}
    ],
    "outputs": [
      {"name": "", "type": "address", "internalType": "address"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isApprovedForAll",
    "inputs": [
      {"name": "owner", "type": "address", "internalType": "address"},
      {"name": "operator", "type": "address", "internalType": "address"}
    ],
    "outputs": [
      {"name": "", "type": "bool", "internalType": "bool"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "tokenURI",
    "inputs": [
      {"name": "tokenId", "type": "uint256", "internalType": "uint256"}
    ],
    "outputs": [
      {"name": "", "type": "string", "internalType": "string"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "balanceOf",
    "inputs": [
      {"name": "owner", "type": "address", "internalType": "address"}
    ],
    "outputs": [
      {"name": "", "type": "uint256", "internalType": "uint256"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTokensByOwner",
    "inputs": [
      {"name": "owner", "type": "address", "internalType": "address"}
    ],
    "outputs": [
      {"name": "tokenIds", "type": "uint256[]", "internalType": "uint256[]"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getTotalSupply",
    "inputs": [],
    "outputs": [
      {"name": "", "type": "uint256", "internalType": "uint256"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "mint",
    "inputs": [
      {"name": "to", "type": "address", "internalType": "address"},
      {"name": "uri", "type": "string", "internalType": "string"}
    ],
    "outputs": [
      {"name": "tokenId", "type": "uint256", "internalType": "uint256"}
    ],
    "stateMutability": "nonpayable"
  }
] as const;

export const MY_NFT_ADDRESS = "0x08DcAA6dE0Ca584b8C5d810B027afE23D31C4AF1" as const;
