import dotenv from 'dotenv';

// 加载环境变量，优先加载 .env.local
dotenv.config({ path: '.env.local' });
dotenv.config(); // 加载默认的 .env 文件作为备用

export const config = {
  // RPC Configuration
  rpcUrl: process.env.RPC_URL || 'https://sepolia.infura.io/v3/dca2a8416ac24058860426614449251d',
  
  // Token Contract
  tokenAddress: process.env.TOKEN_ADDRESS || '0x89865aaf2251b10ffc80ce4a809522506bf10ba2',
  
  // Indexing Configuration
  startBlock: process.env.START_BLOCK ? parseInt(process.env.START_BLOCK) : undefined,
  minConfirmations: parseInt(process.env.MIN_CONFIRMATIONS || '5'),
  stepBlocks: parseInt(process.env.STEP_BLOCKS || '2500'),
  idleIntervalMs: parseInt(process.env.IDLE_INTERVAL_MS || '5000'),
  
  // Database Configuration
  databaseUrl: process.env.DATABASE_URL || '',
  
  // Optional
  etherscanApiKey: process.env.ETHERSCAN_API_KEY,
  adminApiKey: process.env.ADMIN_API_KEY,
  
  // Server Configuration
  port: parseInt(process.env.PORT || '3001'),
  
  // Rate Limiting
  rateLimit: {
    max: 100,
    timeWindow: '1 minute'
  }
};

// Validation
if (!config.databaseUrl) {
  console.log('DATABASE_URL not provided, using in-memory database for demo');
}

if (!config.tokenAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
  throw new Error('Invalid TOKEN_ADDRESS format');
}
