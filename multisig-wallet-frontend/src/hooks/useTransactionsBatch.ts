import { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'
import { formatEther } from 'viem'
import { useContractAddress } from './useContractAddress'
import { multiSigWalletAbi } from '@/generated'
import type { Transaction } from '@/types'

// 交易状态映射
const TRANSACTION_STATUS = {
  0: 'Pending',    // 待确认
  1: 'Ready',      // 可执行
  2: 'Executed',   // 已执行
  3: 'Failed'      // 执行失败
} as const

export function useTransactionsBatch() {
  const contractAddress = useContractAddress()
  const publicClient = usePublicClient()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [transactionCount, setTransactionCount] = useState(0)

  useEffect(() => {
    if (!contractAddress || !publicClient) return

    const fetchTransactions = async () => {
      setLoading(true)
      try {
        // 获取交易总数
        const count = await publicClient.readContract({
          address: contractAddress,
          abi: multiSigWalletAbi,
          functionName: 'getTransactionCount',
        }) as bigint

        const totalCount = Number(count)
        setTransactionCount(totalCount)

        if (totalCount === 0) {
          setTransactions([])
          setLoading(false)
          return
        }

        // 批量获取交易数据
        const txPromises = []
        const confirmationPromises = []

        for (let i = 0; i < totalCount; i++) {
          txPromises.push(
            publicClient.readContract({
              address: contractAddress,
              abi: multiSigWalletAbi,
              functionName: 'getTransaction',
              args: [BigInt(i)],
            })
          )

          confirmationPromises.push(
            publicClient.readContract({
              address: contractAddress,
              abi: multiSigWalletAbi,
              functionName: 'getConfirmations',
              args: [BigInt(i)],
            })
          )
        }

        const [txResults, confirmationResults] = await Promise.all([
          Promise.all(txPromises),
          Promise.all(confirmationPromises),
        ])

        const formattedTransactions: Transaction[] = txResults.map((txData, index) => {
          const [to, value, data, status, confirmationCount, timestamp] = txData as [
            string, bigint, string, number, bigint, bigint
          ]
          const confirmations = confirmationResults[index] as string[]

          return {
            id: index,
            to,
            value: formatEther(value),
            data,
            status: TRANSACTION_STATUS[status as keyof typeof TRANSACTION_STATUS],
            confirmations: Number(confirmationCount),
            timestamp: Number(timestamp),
            confirmationAddresses: confirmations,
          }
        })

        setTransactions(formattedTransactions)
      } catch (error) {
        console.error('获取交易数据失败:', error)
        setTransactions([])
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [contractAddress, publicClient])

  const refetch = async () => {
    if (!contractAddress || !publicClient) return

    setLoading(true)
    try {
      // 获取交易总数
      const count = await publicClient.readContract({
        address: contractAddress,
        abi: multiSigWalletAbi,
        functionName: 'getTransactionCount',
      }) as bigint

      const totalCount = Number(count)
      setTransactionCount(totalCount)

      if (totalCount === 0) {
        setTransactions([])
        setLoading(false)
        return
      }

      // 批量获取交易数据
      const txPromises = []
      const confirmationPromises = []

      for (let i = 0; i < totalCount; i++) {
        txPromises.push(
          publicClient.readContract({
            address: contractAddress,
            abi: multiSigWalletAbi,
            functionName: 'getTransaction',
            args: [BigInt(i)],
          })
        )

        confirmationPromises.push(
          publicClient.readContract({
            address: contractAddress,
            abi: multiSigWalletAbi,
            functionName: 'getConfirmations',
            args: [BigInt(i)],
          })
        )
      }

      const [txResults, confirmationResults] = await Promise.all([
        Promise.all(txPromises),
        Promise.all(confirmationPromises),
      ])

      const formattedTransactions: Transaction[] = txResults.map((txData, index) => {
        const [to, value, data, status, confirmationCount, timestamp] = txData as [
          string, bigint, string, number, bigint, bigint
        ]
        const confirmations = confirmationResults[index] as string[]

        return {
          id: index,
          to,
          value: formatEther(value),
          data,
          status: TRANSACTION_STATUS[status as keyof typeof TRANSACTION_STATUS],
          confirmations: Number(confirmationCount),
          timestamp: Number(timestamp),
          confirmationAddresses: confirmations,
        }
      })

      setTransactions(formattedTransactions)
    } catch (error) {
      console.error('刷新交易数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    transactions,
    transactionCount,
    loading,
    refetch,
  }
}
