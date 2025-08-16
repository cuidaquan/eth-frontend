export const NFTMarketABI = [
  {
    "type": "constructor",
    "inputs": [
      {"name": "_paymentToken", "type": "address", "internalType": "address"},
      {"name": "_nftContract", "type": "address", "internalType": "address"}
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "list",
    "inputs": [
      {"name": "tokenId", "type": "uint256", "internalType": "uint256"},
      {"name": "price", "type": "uint256", "internalType": "uint256"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "buyNFT",
    "inputs": [
      {"name": "listingId", "type": "uint256", "internalType": "uint256"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "delist",
    "inputs": [
      {"name": "listingId", "type": "uint256", "internalType": "uint256"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getListing",
    "inputs": [
      {"name": "listingId", "type": "uint256", "internalType": "uint256"}
    ],
    "outputs": [
      {
        "name": "",
        "type": "tuple",
        "internalType": "struct NFTMarket.Listing",
        "components": [
          {"name": "seller", "type": "address", "internalType": "address"},
          {"name": "nftContract", "type": "address", "internalType": "address"},
          {"name": "tokenId", "type": "uint256", "internalType": "uint256"},
          {"name": "price", "type": "uint256", "internalType": "uint256"},
          {"name": "active", "type": "bool", "internalType": "bool"}
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getCurrentListingId",
    "inputs": [],
    "outputs": [
      {"name": "", "type": "uint256", "internalType": "uint256"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "listings",
    "inputs": [
      {"name": "", "type": "uint256", "internalType": "uint256"}
    ],
    "outputs": [
      {"name": "seller", "type": "address", "internalType": "address"},
      {"name": "nftContract", "type": "address", "internalType": "address"},
      {"name": "tokenId", "type": "uint256", "internalType": "uint256"},
      {"name": "price", "type": "uint256", "internalType": "uint256"},
      {"name": "active", "type": "bool", "internalType": "bool"}
    ],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "NFTListed",
    "inputs": [
      {"name": "listingId", "type": "uint256", "indexed": true, "internalType": "uint256"},
      {"name": "seller", "type": "address", "indexed": true, "internalType": "address"},
      {"name": "nftContract", "type": "address", "indexed": true, "internalType": "address"},
      {"name": "tokenId", "type": "uint256", "indexed": false, "internalType": "uint256"},
      {"name": "price", "type": "uint256", "indexed": false, "internalType": "uint256"}
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "NFTSold",
    "inputs": [
      {"name": "listingId", "type": "uint256", "indexed": true, "internalType": "uint256"},
      {"name": "buyer", "type": "address", "indexed": true, "internalType": "address"},
      {"name": "seller", "type": "address", "indexed": true, "internalType": "address"},
      {"name": "nftContract", "type": "address", "indexed": false, "internalType": "address"},
      {"name": "tokenId", "type": "uint256", "indexed": false, "internalType": "uint256"},
      {"name": "price", "type": "uint256", "indexed": false, "internalType": "uint256"}
    ],
    "anonymous": false
  }
] as const;

export const NFT_MARKET_ADDRESS = "0x54924e9036f1Ac50be3b4A4a87813AeDDdd703B2" as const;
