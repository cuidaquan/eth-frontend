import { useState, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { useTransactionsBatch } from './useTransactionsBatch'
import { useTransactionHandler } from './useTransactionHandler'
import { useContractAddress } from './useContractAddress'
import { useIsOwner } from './useIsOwner'
import { multiSigWalletAbi } from '@/generated'

/**
 * 交易管理 hook - 统一处理交易操作和状态更新
 */
export function useTransactionManager() {
  const { address } = useAccount()
  const contractAddress = useContractAddress()
  const isOwner = useIsOwner()
  const { transactions, loading, refetch } = useTransactionsBatch()
  const { submitTransaction, isLoading: isTransactionLoading } = useTransactionHandler()
  
  // 跟踪正在处理的交易ID
  const [processingTxIds, setProcessingTxIds] = useState<Set<number>>(new Set())

  // 标记交易为处理中
  const setTxProcessing = useCallback((txId: number, processing: boolean) => {
    setProcessingTxIds(prev => {
      const newSet = new Set(prev)
      if (processing) {
        newSet.add(txId)
      } else {
        newSet.delete(txId)
      }
      return newSet
    })
  }, [])

  // 确认交易
  const confirmTransaction = useCallback(async (txId: number) => {
    if (!contractAddress || !isOwner) return

    setTxProcessing(txId, true)
    
    await submitTransaction(
      {
        address: contractAddress,
        abi: multiSigWalletAbi,
        functionName: 'confirmTransaction',
        args: [BigInt(txId)],
      },
      {
        onSuccess: async () => {
          await refetch()
          setTxProcessing(txId, false)
        },
        onError: () => {
          setTxProcessing(txId, false)
        },
        successMessage: '交易确认成功！',
        errorMessage: '确认交易失败，请重试'
      }
    )
  }, [contractAddress, isOwner, submitTransaction, refetch, setTxProcessing])

  // 撤销确认
  const revokeConfirmation = useCallback(async (txId: number) => {
    if (!contractAddress || !isOwner) return

    setTxProcessing(txId, true)
    
    await submitTransaction(
      {
        address: contractAddress,
        abi: multiSigWalletAbi,
        functionName: 'revokeConfirmation',
        args: [BigInt(txId)],
      },
      {
        onSuccess: async () => {
          await refetch()
          setTxProcessing(txId, false)
        },
        onError: () => {
          setTxProcessing(txId, false)
        },
        successMessage: '撤销确认成功！',
        errorMessage: '撤销确认失败，请重试'
      }
    )
  }, [contractAddress, isOwner, submitTransaction, refetch, setTxProcessing])

  // 执行交易
  const executeTransaction = useCallback(async (txId: number) => {
    if (!contractAddress || !isOwner) return

    setTxProcessing(txId, true)
    
    await submitTransaction(
      {
        address: contractAddress,
        abi: multiSigWalletAbi,
        functionName: 'executeTransaction',
        args: [BigInt(txId)],
      },
      {
        onSuccess: async () => {
          await refetch()
          setTxProcessing(txId, false)
        },
        onError: () => {
          setTxProcessing(txId, false)
        },
        successMessage: '交易执行成功！',
        errorMessage: '执行交易失败，请重试'
      }
    )
  }, [contractAddress, isOwner, submitTransaction, refetch, setTxProcessing])

  // 检查交易是否正在处理中
  const isTxProcessing = useCallback((txId: number) => {
    return processingTxIds.has(txId)
  }, [processingTxIds])

  // 检查用户是否已确认某个交易
  const isConfirmedByUser = useCallback((transaction: any) => {
    return transaction.confirmationAddresses?.includes(address || '') || false
  }, [address])

  return {
    transactions,
    loading,
    isOwner,
    isTransactionLoading,
    confirmTransaction,
    revokeConfirmation,
    executeTransaction,
    isTxProcessing,
    isConfirmedByUser,
    refetch,
  }
}
