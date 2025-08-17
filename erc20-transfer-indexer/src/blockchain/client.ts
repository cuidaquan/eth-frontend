import { createPublicClient, http, parseAbiItem, Log, Block } from 'viem';
import { sepolia } from 'viem/chains';
import { config } from '../config';

export class BlockchainClient {
  private client;
  private transferEvent;

  constructor() {
    this.client = createPublicClient({
      chain: sepolia,
      transport: http(config.rpcUrl)
    });

    this.transferEvent = parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)');
  }

  // 获取最新区块号
  async getLatestBlockNumber(): Promise<bigint> {
    return await this.client.getBlockNumber();
  }

  // 获取区块信息
  async getBlock(blockNumber: bigint): Promise<Block> {
    return await this.client.getBlock({ blockNumber });
  }

  // 批量获取区块时间戳
  async getBlockTimestamps(blockNumbers: number[]): Promise<Map<number, Date>> {
    const uniqueBlocks = [...new Set(blockNumbers)];
    const timestamps = new Map<number, Date>();

    // 并发获取区块信息（限制并发数）
    const batchSize = 10;
    for (let i = 0; i < uniqueBlocks.length; i += batchSize) {
      const batch = uniqueBlocks.slice(i, i + batchSize);
      const promises = batch.map(async (blockNumber) => {
        try {
          const block = await this.getBlock(BigInt(blockNumber));
          return { blockNumber, timestamp: new Date(Number(block.timestamp) * 1000) };
        } catch (error) {
          console.error(`Failed to get block ${blockNumber}:`, error);
          return { blockNumber, timestamp: new Date() }; // 使用当前时间作为fallback
        }
      });

      const results = await Promise.all(promises);
      results.forEach(({ blockNumber, timestamp }) => {
        timestamps.set(blockNumber, timestamp);
      });
    }

    return timestamps;
  }

  // 获取Transfer事件日志
  async getTransferLogs(fromBlock: bigint, toBlock: bigint): Promise<Log[]> {
    try {
      const logs = await this.client.getLogs({
        address: config.tokenAddress as `0x${string}`,
        event: this.transferEvent,
        fromBlock,
        toBlock
      });

      return logs;
    } catch (error) {
      console.error(`Failed to get logs from block ${fromBlock} to ${toBlock}:`, error);
      throw error;
    }
  }

  // 解析Transfer事件
  parseTransferLog(log: Log) {
    try {
      // 直接从log中解析参数，因为我们已经通过event过滤了
      if (log.topics && log.topics.length >= 3) {
        // topics[0] 是事件签名
        // topics[1] 是 from (indexed)
        // topics[2] 是 to (indexed)
        // data 包含 value (非indexed)

        const from = `0x${log.topics[1]!.slice(26)}` as string; // 移除前面的0填充
        const to = `0x${log.topics[2]!.slice(26)}` as string;   // 移除前面的0填充
        const value = BigInt(log.data || '0x0');

        return {
          from,
          to,
          value
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to parse transfer log:', error);
      return null;
    }
  }

  // 格式化代币数量（假设18位小数）
  formatTokenAmount(value: bigint, decimals: number = 18): string {
    const divisor = BigInt(10 ** decimals);
    const quotient = value / divisor;
    const remainder = value % divisor;
    
    if (remainder === 0n) {
      return quotient.toString();
    }
    
    const remainderStr = remainder.toString().padStart(decimals, '0');
    const trimmedRemainder = remainderStr.replace(/0+$/, '');
    
    return trimmedRemainder ? `${quotient}.${trimmedRemainder}` : quotient.toString();
  }
}

export const blockchainClient = new BlockchainClient();
