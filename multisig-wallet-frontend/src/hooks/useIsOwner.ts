import { useAccount } from 'wagmi'
import { useMultiSigWallet } from './useMultiSigWallet'

/**
 * 检查当前连接的钱包地址是否是多签钱包的持有人
 */
export function useIsOwner() {
  const { address, isConnected } = useAccount()
  const { owners } = useMultiSigWallet()

  // 如果钱包未连接，返回 false
  if (!isConnected || !address) {
    return false
  }

  // 检查当前地址是否在持有人列表中
  return owners.some(owner => 
    owner.toLowerCase() === address.toLowerCase()
  )
}
