import { useState, useEffect, useCallback } from 'react'
import { usePublicClient } from 'wagmi'
import { formatEther } from 'viem'
import { BANK_ADDRESS, BANK_ABI } from '../lib/contract'
import { CachedTransactionRecord } from '../types/bank'

const STORAGE_KEY = 'bank-dapp-transaction-history'
const MAX_RECORDS = 200 // 最多缓存 200 条记录

export function useTransactionHistory(enabled = true) {
  const [transactions, setTransactions] = useState<CachedTransactionRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastSyncedBlock, setLastSyncedBlock] = useState<bigint>(0n)
  
  const publicClient = usePublicClient()

  // 从 localStorage 加载缓存的交易记录
  useEffect(() => {
    if (!enabled) return

    try {
      const cached = localStorage.getItem(STORAGE_KEY)
      if (cached) {
        const data = JSON.parse(cached)
        // 恢复 BigInt 类型
        const restoredTxs = (data.transactions || []).map((tx: any) => ({
          ...tx,
          blockNumber: BigInt(tx.blockNumber)
        }))
        setTransactions(restoredTxs)
        setLastSyncedBlock(BigInt(data.lastSyncedBlock || '0'))
      }
    } catch (error) {
      console.error('Failed to load cached transactions:', error)
    }
  }, [enabled])

  // 保存交易记录到 localStorage
  const saveToStorage = useCallback((txs: CachedTransactionRecord[], lastBlock: bigint) => {
    try {
      // 转换 BigInt 为字符串以便序列化
      const serializedTxs = txs.slice(0, MAX_RECORDS).map(tx => ({
        ...tx,
        blockNumber: tx.blockNumber.toString()
      }))

      const data = {
        transactions: serializedTxs,
        lastSyncedBlock: lastBlock.toString(),
        updatedAt: Date.now()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save transactions to storage:', error)
    }
  }, [])

  // 获取区块时间戳（带重试和错误处理）
  const getBlockTimestamp = useCallback(async (blockNumber: bigint): Promise<number> => {
    if (!publicClient) return Date.now()

    try {
      const block = await publicClient.getBlock({ blockNumber })
      return Number(block.timestamp) * 1000
    } catch (error: any) {
      // 如果是 429 错误，返回当前时间而不是重试
      if (error?.status === 429) {
        console.warn('Rate limited when fetching block timestamp, using current time')
        return Date.now()
      }
      console.error('Failed to get block timestamp:', error)
      return Date.now()
    }
  }, [publicClient])

  // 获取新的交易记录
  const fetchNewTransactions = useCallback(async () => {
    if (!enabled || !publicClient) return

    setIsLoading(true)
    
    try {
      const currentBlock = await publicClient.getBlockNumber()
      const fromBlock = lastSyncedBlock > 0n ? lastSyncedBlock + 1n : currentBlock - 1000n // 如果是首次加载，获取最近 100 个区块

      // 获取存款事件
      const depositLogs = await publicClient.getLogs({
        address: BANK_ADDRESS,
        event: {
          type: 'event',
          name: 'Deposit',
          inputs: [
            { name: 'depositor', type: 'address', indexed: true },
            { name: 'amount', type: 'uint256', indexed: false }
          ]
        },
        fromBlock,
        toBlock: currentBlock
      }).catch(error => {
        if (error?.status === 429) {
          console.warn('Rate limited when fetching deposit logs')
          return []
        }
        throw error
      })

      // 获取提取事件
      const withdrawLogs = await publicClient.getLogs({
        address: BANK_ADDRESS,
        event: {
          type: 'event',
          name: 'Withdraw',
          inputs: [
            { name: 'admin', type: 'address', indexed: true },
            { name: 'amount', type: 'uint256', indexed: false }
          ]
        },
        fromBlock,
        toBlock: currentBlock
      }).catch(error => {
        if (error?.status === 429) {
          console.warn('Rate limited when fetching withdraw logs')
          return []
        }
        throw error
      })

      // 处理新的交易记录
      const newTransactions: CachedTransactionRecord[] = []

      // 处理存款记录
      for (const log of depositLogs) {
        const blockTimestamp = await getBlockTimestamp(log.blockNumber!)
        newTransactions.push({
          id: `${log.transactionHash}-deposit-${log.logIndex}`,
          type: 'deposit',
          user: log.args.depositor as string,
          amount: formatEther(log.args.amount as bigint),
          blockNumber: log.blockNumber!,
          transactionHash: log.transactionHash!,
          timestamp: Date.now(),
          blockTimestamp
        })
      }

      // 处理提取记录
      for (const log of withdrawLogs) {
        const blockTimestamp = await getBlockTimestamp(log.blockNumber!)
        newTransactions.push({
          id: `${log.transactionHash}-withdraw-${log.logIndex}`,
          type: 'withdraw',
          user: log.args.admin as string,
          amount: formatEther(log.args.amount as bigint),
          blockNumber: log.blockNumber!,
          transactionHash: log.transactionHash!,
          timestamp: Date.now(),
          blockTimestamp
        })
      }

      if (newTransactions.length > 0) {
        setTransactions(prev => {
          // 合并新旧记录，按交易hash去重
          const combined = [...newTransactions, ...prev]
          const uniqueByHash = combined.filter((tx, index, arr) =>
            arr.findIndex(t => t.transactionHash === tx.transactionHash && t.type === tx.type) === index
          )
          const sorted = uniqueByHash.sort((a, b) => Number(b.blockNumber - a.blockNumber))

          // 保存到 localStorage
          saveToStorage(sorted, currentBlock)

          return sorted.slice(0, MAX_RECORDS)
        })
      }

      setLastSyncedBlock(currentBlock)
      
    } catch (error) {
      console.error('Failed to fetch transaction history:', error)
    } finally {
      setIsLoading(false)
    }
  }, [enabled, publicClient, lastSyncedBlock, getBlockTimestamp, saveToStorage])

  // 添加新交易记录（用于实时更新）
  const addTransaction = useCallback((newTx: Omit<CachedTransactionRecord, 'id' | 'timestamp'>) => {
    const transaction: CachedTransactionRecord = {
      ...newTx,
      id: `${newTx.transactionHash}-${newTx.type}`,
      timestamp: Date.now()
    }

    setTransactions(prev => {
      // 按交易hash和类型去重
      const filtered = prev.filter(tx =>
        !(tx.transactionHash === transaction.transactionHash && tx.type === transaction.type)
      )
      const updated = [transaction, ...filtered]
        .sort((a, b) => Number(b.blockNumber - a.blockNumber))
        .slice(0, MAX_RECORDS)

      saveToStorage(updated, lastSyncedBlock)
      return updated
    })
  }, [lastSyncedBlock, saveToStorage])

  // 清除缓存
  const clearCache = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setTransactions([])
    setLastSyncedBlock(0n)
  }, [])

  // 清除重复数据
  const deduplicateTransactions = useCallback(() => {
    setTransactions(prev => {
      const uniqueByHash = prev.filter((tx, index, arr) =>
        arr.findIndex(t => t.transactionHash === tx.transactionHash && t.type === tx.type) === index
      )
      const sorted = uniqueByHash.sort((a, b) => Number(b.blockNumber - a.blockNumber))

      // 保存到 localStorage
      saveToStorage(sorted, lastSyncedBlock)

      return sorted.slice(0, MAX_RECORDS)
    })
  }, [lastSyncedBlock, saveToStorage])

  // 初始加载和定期同步
  useEffect(() => {
    if (!enabled) return

    // 初始加载
    fetchNewTransactions()

    // 每 2 分钟同步一次新交易，减少 API 请求
    const interval = setInterval(fetchNewTransactions, 120000)
    
    return () => clearInterval(interval)
  }, [enabled, fetchNewTransactions])

  return {
    transactions: transactions.slice(0, 50), // 只显示最新的 50 条
    isLoading,
    lastSyncedBlock,
    addTransaction,
    clearCache,
    deduplicateTransactions,
    refetch: fetchNewTransactions
  }
}
