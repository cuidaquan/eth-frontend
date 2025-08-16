import { Address } from 'viem'

export interface TopDepositor {
  depositor: Address
  amount: bigint
}

export interface TransactionRecord {
  hash: string
  type: 'deposit' | 'withdraw'
  address: Address
  amount: bigint
  timestamp: number
  blockNumber: number
}

// 新的缓存交易记录类型
export interface CachedTransactionRecord {
  id: string
  type: 'deposit' | 'withdraw'
  user: string
  amount: string
  blockNumber: bigint
  transactionHash: string
  timestamp: number
  blockTimestamp?: number
}
