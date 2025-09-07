import { createPublicClient, http, keccak256, toHex, hexToBigInt, hexToNumber } from 'viem';
import { sepolia } from 'viem/chains';

// Create client
const client = createPublicClient({
  chain: sepolia,
  transport: http()
});

// Contract address
const contractAddress = '0x195083445074acfd59d627b9a7b76988c578304d';

async function readLocksArray() {
  try {
    // The _locks array is at storage slot 0
    // Array length is stored at keccak256(0)
    const arrayLengthSlot = keccak256(toHex(0, { size: 32 }));
    const lengthHex = await client.getStorageAt({
      address: contractAddress,
      slot: arrayLengthSlot
    });
    
    const arrayLength = hexToNumber(lengthHex);
    console.log(`Array length from storage: ${arrayLength}`);
    
    // According to the constructor, there should be 11 elements
    const actualLength = 11;
    console.log(`Reading ${actualLength} locks from the array\n`);

    // Read each lock
    for (let i = 0; i < actualLength; i++) {
      // Calculate storage slot for this array element
      // Base slot for array elements = keccak256(0) + (index * 2)
      // Each LockInfo takes 2 slots: address+startTime (32 bytes), amount (32 bytes)
      const baseSlot = BigInt(arrayLengthSlot) + BigInt(i * 2);
      
      // Read the two slots for this LockInfo struct
      // Slot 0: user (address, 20 bytes) + startTime (uint64, 8 bytes) = 28 bytes, packed in one slot
      const slot0Hex = await client.getStorageAt({
        address: contractAddress,
        slot: `0x${baseSlot.toString(16)}`
      });
      
      // Slot 1: amount (uint256, 32 bytes)
      const slot1Hex = await client.getStorageAt({
        address: contractAddress,
        slot: `0x${(baseSlot + 1n).toString(16)}`
      });

      // Parse slot0: startTime (8 bytes, higher order) + user (20 bytes, lower order)
      const slot0Value = BigInt(slot0Hex);
      
      // Extract user address (lower 20 bytes)
      const userAddress = `0x${(slot0Value & 0xffffffffffffffffffffffffffffffffffffffffn).toString(16).padStart(40, '0')}`;
      
      // Extract startTime (next 8 bytes, shifted right by 160 bits)
      const startTime = Number((slot0Value >> 160n) & 0xffffffffffffffffn);
      
      // Parse amount from slot1
      const amount = hexToBigInt(slot1Hex);
      
      // Format amount in ETH
      const amountInEth = Number(amount) / 1e18;
      
      // Convert timestamp to readable date
      const date = new Date(startTime * 1000);
      
      console.log(`locks[${i}]: user: ${userAddress}, startTime: ${startTime} (${date.toISOString()}), amount: ${amountInEth} ETH`);
    }
    
  } catch (error) {
    console.error('Error reading locks array:', error);
  }
}

// Run the function
readLocksArray();