import { useWatchContractEvent } from 'wagmi'
import { multiSigWalletAbi } from '@/generated'
import { useContractAddress } from './useContractAddress'

export function useTransactionEvents() {
  const contractAddress = useContractAddress()
  
  // 如果没有合约地址，不监听事件
  if (!contractAddress) {
    return
  }

  // 监听交易提交事件
  useWatchContractEvent({
    address: contractAddress || undefined,
    abi: multiSigWalletAbi,
    eventName: 'TransactionSubmitted',
    onLogs(logs) {
      console.log('New transaction submitted:', logs)
      // 这里可以触发数据刷新或显示通知
    },
  })

  // 监听交易确认事件
  useWatchContractEvent({
    address: contractAddress || undefined,
    abi: multiSigWalletAbi,
    eventName: 'TransactionConfirmed',
    onLogs(logs) {
      console.log('Transaction confirmed:', logs)
      // 这里可以触发数据刷新或显示通知
    },
  })

  // 监听交易执行事件
  useWatchContractEvent({
    address: contractAddress || undefined,
    abi: multiSigWalletAbi,
    eventName: 'TransactionExecuted',
    onLogs(logs) {
      console.log('Transaction executed:', logs)
      // 这里可以触发数据刷新或显示通知
    },
  })

  // 监听确认撤销事件
  useWatchContractEvent({
    address: contractAddress || undefined,
    abi: multiSigWalletAbi,
    eventName: 'TransactionRevoked',
    onLogs(logs) {
      console.log('Transaction confirmation revoked:', logs)
      // 这里可以触发数据刷新或显示通知
    },
  })

  // 监听存款事件
  useWatchContractEvent({
    address: contractAddress || undefined,
    abi: multiSigWalletAbi,
    eventName: 'Deposit',
    onLogs(logs) {
      console.log('ETH deposited:', logs)
      // 这里可以触发余额刷新
    },
  })
}
