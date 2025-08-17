import { db } from './connection';
import { Transfer, IndexState, TransferQueryParams } from '../types';

export class TransferDAO {
  // 批量插入转账记录
  async insertTransfers(transfers: Omit<Transfer, 'id' | 'createdAt'>[]): Promise<void> {
    if (transfers.length === 0) return;

    // 使用内存数据库的方法
    for (const transfer of transfers) {
      (db as any).addTransfer(transfer);
    }

    console.log(`插入了 ${transfers.length} 条转账记录`);
  }

  // 查询转账记录
  async getTransfers(params: TransferQueryParams): Promise<{ transfers: Transfer[], nextCursor?: string }> {
    const { address, direction = 'all', limit = 50, cursor } = params;

    // 使用内存数据库的方法
    let transfers = (db as any).getTransfersByAddress(address, direction);

    // 游标分页
    if (cursor) {
      const cursorId = parseInt(cursor);
      transfers = transfers.filter((t: Transfer) => parseInt(t.id) < cursorId);
    }

    // 限制数量
    const actualLimit = Math.min(limit, 200);
    let nextCursor: string | undefined;

    if (transfers.length > actualLimit) {
      nextCursor = transfers[actualLimit - 1].id;
      transfers = transfers.slice(0, actualLimit);
    }

    return { transfers, nextCursor };
  }
}

export class IndexStateDAO {
  // 获取索引状态
  async getIndexState(tokenContract: string): Promise<IndexState | null> {
    const state = (db as any).getIndexState(tokenContract);
    return state || null;
  }

  // 更新索引状态
  async updateIndexState(tokenContract: string, lastIndexedBlock: number): Promise<void> {
    (db as any).setIndexState(tokenContract, lastIndexedBlock);
    console.log(`更新索引状态: ${tokenContract} -> 区块 ${lastIndexedBlock}`);
  }

  // 在事务中更新索引状态
  async updateIndexStateInTransaction(
    _client: any,
    tokenContract: string,
    lastIndexedBlock: number
  ): Promise<void> {
    // 在内存数据库中，事务和普通操作相同
    await this.updateIndexState(tokenContract, lastIndexedBlock);
  }
}

export const transferDAO = new TransferDAO();
export const indexStateDAO = new IndexStateDAO();
