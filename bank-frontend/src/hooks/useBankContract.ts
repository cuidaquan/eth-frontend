import { useEffect } from 'react'
import { useReadContract, useWriteContract, useWatchContractEvent, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { useQueryClient } from '@tanstack/react-query'
import { BANK_ADDRESS, BANK_ABI } from '../lib/contract'
import { TopDepositor } from '../types/bank'

// 读取合约数据的 hooks
export function useContractBalance(enabled = true) {
  return useReadContract({
    address: BANK_ADDRESS,
    abi: BANK_ABI,
    functionName: 'getContractBalance',
    query: {
      enabled,
    },
  })
}

export function useUserBalance(address?: `0x${string}`, enabled = true) {
  return useReadContract({
    address: BANK_ADDRESS,
    abi: BANK_ABI,
    functionName: 'getBalance',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && enabled,
    },
  })
}

export function useAdmin(enabled = true) {
  return useReadContract({
    address: BANK_ADDRESS,
    abi: BANK_ABI,
    functionName: 'admin',
    query: {
      enabled,
    },
  })
}

export function useTopDepositors(enabled = true) {
  const result = useReadContract({
    address: BANK_ADDRESS,
    abi: BANK_ABI,
    functionName: 'getTopDepositors',
    query: {
      enabled,
    },
  })

  const transformedData = result.data && Array.isArray(result.data) ?
    (result.data as unknown as Array<{depositor: string, amount: bigint}>).map((item) => ({
      depositor: item.depositor as `0x${string}`,
      amount: item.amount,
    })) as TopDepositor[] : []

  return {
    ...result,
    data: transformedData,
  }
}

// 写入合约的 hooks
export function useBankContract() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const queryClient = useQueryClient()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // 当交易确认后，刷新相关数据
  useEffect(() => {
    if (isConfirmed) {
      queryClient.invalidateQueries({ queryKey: ['readContract'] })
    }
  }, [isConfirmed, queryClient])

  const deposit = (amount: string) => {
    return writeContract({
      address: BANK_ADDRESS,
      abi: BANK_ABI,
      functionName: 'deposit',
      value: parseEther(amount),
    })
  }

  const withdraw = (amount: string) => {
    return writeContract({
      address: BANK_ADDRESS,
      abi: BANK_ABI,
      functionName: 'withdraw',
      args: [parseEther(amount)],
    })
  }

  const withdrawAll = () => {
    return writeContract({
      address: BANK_ADDRESS,
      abi: BANK_ABI,
      functionName: 'withdrawAll',
    })
  }

  const changeAdmin = (newAdmin: `0x${string}`) => {
    return writeContract({
      address: BANK_ADDRESS,
      abi: BANK_ABI,
      functionName: 'changeAdmin',
      args: [newAdmin],
    })
  }

  return {
    deposit,
    withdraw,
    withdrawAll,
    changeAdmin,
    hash,
    isPending,
    isConfirming,
    isConfirmed,
    error,
  }
}

// 事件监听 hooks
export function useDepositEvents(onDeposit?: (depositor: string, amount: bigint, event?: any) => void) {
  useWatchContractEvent({
    address: BANK_ADDRESS,
    abi: BANK_ABI,
    eventName: 'Deposit',
    onLogs: (logs) => {
      logs.forEach((log) => {
        if (log.args.depositor && log.args.amount && onDeposit) {
          onDeposit(log.args.depositor, log.args.amount, log)
        }
      })
    },
  })
}

export function useWithdrawEvents(onWithdraw?: (admin: string, amount: bigint, event?: any) => void) {
  useWatchContractEvent({
    address: BANK_ADDRESS,
    abi: BANK_ABI,
    eventName: 'Withdraw',
    onLogs: (logs) => {
      logs.forEach((log) => {
        if (log.args.admin && log.args.amount && onWithdraw) {
          onWithdraw(log.args.admin, log.args.amount, log)
        }
      })
    },
  })
}

export function useTopDepositorsUpdatedEvents(onUpdate?: () => void) {
  useWatchContractEvent({
    address: BANK_ADDRESS,
    abi: BANK_ABI,
    eventName: 'TopDepositorsUpdated',
    onLogs: () => {
      if (onUpdate) {
        onUpdate()
      }
    },
  })
}

// 工具函数
export const formatEthAmount = (amount: bigint, decimals = 4) => {
  return parseFloat(formatEther(amount)).toFixed(decimals)
}

export const shortenAddress = (address: string, chars = 4) => {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}
