import { Transfer, IndexState } from '../types';

// 简化的内存数据库用于演示
class MemoryDatabase {
  private transfers: Map<string, Transfer> = new Map();
  private indexStates: Map<string, IndexState> = new Map();
  private nextId = 1;

  constructor() {
    console.log('使用内存数据库进行演示');
  }



  async query(text: string, params?: any[]): Promise<any> {
    // 模拟数据库查询
    if (text.includes('SELECT NOW()')) {
      return { rows: [{ now: new Date() }] };
    }

    if (text.includes('INSERT INTO transfers')) {
      // 模拟插入转账记录
      return { rowCount: 1 };
    }

    if (text.includes('SELECT * FROM transfers')) {
      // 模拟查询转账记录
      const transfersArray = Array.from(this.transfers.values());
      return { rows: transfersArray };
    }

    if (text.includes('SELECT * FROM index_state')) {
      // 模拟查询索引状态
      const tokenContract = params?.[0];
      const state = this.indexStates.get(tokenContract);
      return { rows: state ? [state] : [] };
    }

    return { rows: [], rowCount: 0 };
  }

  async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    // 模拟事务
    const mockClient = {
      query: this.query.bind(this)
    };
    return await callback(mockClient);
  }

  async close(): Promise<void> {
    console.log('关闭内存数据库连接');
  }

  async testConnection(): Promise<boolean> {
    console.log('内存数据库连接测试成功');
    return true;
  }

  // 内存数据库特有方法
  addTransfer(transfer: Omit<Transfer, 'id' | 'createdAt'>): void {
    const id = this.nextId++;
    const fullTransfer: Transfer = {
      ...transfer,
      id: id.toString(),
      createdAt: new Date()
    };
    const key = `${transfer.txHash}-${transfer.logIndex}`;
    this.transfers.set(key, fullTransfer);
    console.log(`添加转账记录: ${key}, 总数: ${this.transfers.size}`);
  }

  getTransfersByAddress(address: string, direction: 'sent' | 'received' | 'all' = 'all'): Transfer[] {
    const transfers = Array.from(this.transfers.values());
    const lowerAddress = address.toLowerCase();

    return transfers.filter(transfer => {
      switch (direction) {
        case 'sent':
          return transfer.fromAddress === lowerAddress;
        case 'received':
          return transfer.toAddress === lowerAddress;
        case 'all':
        default:
          return transfer.fromAddress === lowerAddress || transfer.toAddress === lowerAddress;
      }
    }).sort((a, b) => parseInt(b.id) - parseInt(a.id)); // 按ID降序排列
  }

  setIndexState(tokenContract: string, lastIndexedBlock: number): void {
    this.indexStates.set(tokenContract, {
      tokenContract,
      lastIndexedBlock,
      updatedAt: new Date()
    });
  }

  getIndexState(tokenContract: string): IndexState | undefined {
    return this.indexStates.get(tokenContract);
  }

  // 获取转账记录总数
  getTransfersCount(): number {
    return this.transfers.size;
  }

  // 获取所有转账记录（用于调试）
  getAllTransfers(): Transfer[] {
    return Array.from(this.transfers.values());
  }
}

export const db = new MemoryDatabase();
