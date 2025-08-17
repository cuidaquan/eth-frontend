import { blockchainClient } from '../blockchain/client';
import { transferDAO, indexStateDAO } from '../database/dao';
import { db } from '../database/connection';
import { config } from '../config';
import { Transfer } from '../types';

export class TransferIndexer {
  private isRunning = false;
  private shouldStop = false;

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('索引器已在运行中');
      return;
    }

    this.isRunning = true;
    this.shouldStop = false;
    console.log('启动转账事件索引器...');

    try {
      while (!this.shouldStop) {
        await this.indexBatch();
        await this.sleep(config.idleIntervalMs);
      }
    } catch (error) {
      console.error('索引器运行出错:', error);
    } finally {
      this.isRunning = false;
    }
  }

  async stop(): Promise<void> {
    console.log('停止索引器...');
    this.shouldStop = true;
    
    // 等待当前批次完成
    while (this.isRunning) {
      await this.sleep(100);
    }
    console.log('索引器已停止');
  }

  private async indexBatch(): Promise<void> {
    try {
      // 获取当前索引状态
      const indexState = await indexStateDAO.getIndexState(config.tokenAddress);
      const lastIndexedBlock = indexState?.lastIndexedBlock || config.startBlock || 0;

      // 获取最新区块号
      const latestBlock = Number(await blockchainClient.getLatestBlockNumber());
      const toBlock = Math.min(latestBlock - config.minConfirmations, lastIndexedBlock + config.stepBlocks);

      if (toBlock <= lastIndexedBlock) {
        // 没有新区块需要处理
        return;
      }

      const fromBlock = lastIndexedBlock + 1;
      console.log(`索引区块 ${fromBlock} 到 ${toBlock}...`);

      // 获取Transfer事件日志
      const logs = await blockchainClient.getTransferLogs(BigInt(fromBlock), BigInt(toBlock));
      
      if (logs.length === 0) {
        console.log(`区块 ${fromBlock}-${toBlock} 没有Transfer事件`);
        await indexStateDAO.updateIndexState(config.tokenAddress, toBlock);
        return;
      }

      console.log(`找到 ${logs.length} 个Transfer事件`);

      // 解析日志并准备数据
      const transfers: Omit<Transfer, 'id' | 'createdAt'>[] = [];
      const blockNumbers = [...new Set(logs.map(log => Number(log.blockNumber)))];
      
      // 批量获取区块时间戳
      const blockTimestamps = await blockchainClient.getBlockTimestamps(blockNumbers);

      for (const log of logs) {
        const parsed = blockchainClient.parseTransferLog(log);
        if (!parsed) continue;

        const blockNumber = Number(log.blockNumber);
        const timestamp = blockTimestamps.get(blockNumber) || new Date();

        transfers.push({
          tokenContract: config.tokenAddress.toLowerCase(),
          txHash: log.transactionHash!,
          logIndex: Number(log.logIndex),
          blockNumber,
          blockHash: log.blockHash!,
          fromAddress: parsed.from.toLowerCase(),
          toAddress: parsed.to.toLowerCase(),
          valueRaw: parsed.value.toString(),
          valueDecimal: blockchainClient.formatTokenAmount(parsed.value),
          timestamp
        });
      }

      // 在事务中保存数据和更新索引状态
      await db.transaction(async (client) => {
        // 批量插入转账记录
        if (transfers.length > 0) {
          await this.insertTransfersInTransaction(client, transfers);
        }

        // 更新索引状态
        await indexStateDAO.updateIndexStateInTransaction(client, config.tokenAddress, toBlock);
      });

      console.log(`成功索引 ${transfers.length} 条转账记录，更新索引状态到区块 ${toBlock}`);

    } catch (error: any) {
      console.error('批次索引失败:', error);

      // 根据错误类型决定退避时间
      let backoffTime = config.idleIntervalMs * 2;

      if (error.status === 429 || error.details?.includes('Too Many Requests')) {
        // RPC限流，使用更长的退避时间
        backoffTime = 60000; // 1分钟
        console.log('遇到RPC限流，等待1分钟后重试...');
      } else if (error.message?.includes('network') || error.message?.includes('timeout')) {
        // 网络错误，中等退避时间
        backoffTime = 30000; // 30秒
        console.log('网络错误，等待30秒后重试...');
      }

      await this.sleep(Math.min(backoffTime, 300000)); // 最多等待5分钟
    }
  }

  private async insertTransfersInTransaction(_client: any, transfers: Omit<Transfer, 'id' | 'createdAt'>[]): Promise<void> {
    if (transfers.length === 0) return;

    // 使用DAO方法插入转账记录
    await transferDAO.insertTransfers(transfers);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  isIndexerRunning(): boolean {
    return this.isRunning;
  }
}

export const transferIndexer = new TransferIndexer();
