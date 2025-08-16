import { useReadContract, useWriteContract } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { useContractAddress } from './useContractAddress'
import { multiSigWalletAbi } from '@/generated'

export function useMultiSigWallet() {
  const contractAddress = useContractAddress()

  // 如果没有合约地址，返回默认值
  if (!contractAddress) {
    return {
      balance: '0',
      owners: [],
      required: 0,
      transactionCount: 0,
      submitTransaction: () => {},
      confirmTransaction: () => {},
      executeTransaction: () => {},
      revokeConfirmation: () => {},
      isPending: false,
      isValidContract: false,
      contractAddress: null,
    }
  }

  // 读取合约数据
  const { data: balance } = useReadContract({
    address: contractAddress || undefined,
    abi: multiSigWalletAbi,
    functionName: 'getBalance',
  })

  const { data: owners } = useReadContract({
    address: contractAddress || undefined,
    abi: multiSigWalletAbi,
    functionName: 'getOwners',
  })

  const { data: required } = useReadContract({
    address: contractAddress || undefined,
    abi: multiSigWalletAbi,
    functionName: 'required',
  })

  const { data: transactionCount } = useReadContract({
    address: contractAddress || undefined,
    abi: multiSigWalletAbi,
    functionName: 'getTransactionCount',
  })

  // 写入合约
  const { writeContract, isPending } = useWriteContract()

  const submitTransaction = (to: string, value: string, data: string) => {
    writeContract({
      address: contractAddress,
      abi: multiSigWalletAbi,
      functionName: 'submitTransaction',
      args: [to as `0x${string}`, parseEther(value), data as `0x${string}`],
    })
  }

  const confirmTransaction = (txId: number) => {
    writeContract({
      address: contractAddress,
      abi: multiSigWalletAbi,
      functionName: 'confirmTransaction',
      args: [BigInt(txId)],
    })
  }

  const executeTransaction = (txId: number) => {
    writeContract({
      address: contractAddress,
      abi: multiSigWalletAbi,
      functionName: 'executeTransaction',
      args: [BigInt(txId)],
    })
  }

  const revokeConfirmation = (txId: number) => {
    writeContract({
      address: contractAddress,
      abi: multiSigWalletAbi,
      functionName: 'revokeConfirmation',
      args: [BigInt(txId)],
    })
  }

  return {
    balance: balance ? formatEther(balance) : '0',
    owners: owners || [],
    required: required ? Number(required) : 0,
    transactionCount: transactionCount ? Number(transactionCount) : 0,
    submitTransaction,
    confirmTransaction,
    executeTransaction,
    revokeConfirmation,
    isPending,
    isValidContract: true,
    contractAddress,
  }
}
