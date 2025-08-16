import { useSearchParams } from 'react-router-dom'
import { isAddress } from 'viem'

export function useContractAddress(): `0x${string}` | null {
  const [searchParams] = useSearchParams()
  const walletParam = searchParams.get('wallet')
  
  // 只使用 URL 参数中的地址，不设置默认地址
  if (walletParam && isAddress(walletParam)) {
    return walletParam as `0x${string}`
  }
  
  // 没有有效地址时返回 null
  return null
}
