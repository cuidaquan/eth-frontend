import { db } from '../database/connection';

const createTablesSQL = `
-- 转账记录表
CREATE TABLE IF NOT EXISTS transfers (
  id BIGSERIAL PRIMARY KEY,
  token_contract VARCHAR(42) NOT NULL,
  tx_hash VARCHAR(66) NOT NULL,
  log_index INTEGER NOT NULL,
  block_number INTEGER NOT NULL,
  block_hash VARCHAR(66) NOT NULL,
  from_address VARCHAR(42) NOT NULL,
  to_address VARCHAR(42) NOT NULL,
  value_raw NUMERIC(78,0) NOT NULL,
  value_decimal NUMERIC(78,18) NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tx_hash, log_index)
);

-- 索引状态表（支持多合约扩展）
CREATE TABLE IF NOT EXISTS index_state (
  token_contract VARCHAR(42) PRIMARY KEY,
  last_indexed_block INTEGER NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

const createIndexesSQL = `
-- 为查询优化创建索引
CREATE INDEX IF NOT EXISTS idx_transfers_from ON transfers (from_address, block_number DESC, log_index DESC);
CREATE INDEX IF NOT EXISTS idx_transfers_to ON transfers (to_address, block_number DESC, log_index DESC);
CREATE INDEX IF NOT EXISTS idx_transfers_token ON transfers (token_contract);
CREATE INDEX IF NOT EXISTS idx_transfers_block ON transfers (block_number DESC);
CREATE INDEX IF NOT EXISTS idx_transfers_timestamp ON transfers (timestamp DESC);
`;

async function initDatabase() {
  try {
    console.log('开始初始化数据库...');
    
    // 测试连接
    const connected = await db.testConnection();
    if (!connected) {
      throw new Error('无法连接到数据库');
    }

    // 创建表
    console.log('创建表...');
    await db.query(createTablesSQL);
    console.log('表创建成功');

    // 创建索引
    console.log('创建索引...');
    await db.query(createIndexesSQL);
    console.log('索引创建成功');

    console.log('数据库初始化完成！');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  initDatabase();
}
