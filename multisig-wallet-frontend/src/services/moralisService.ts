import Moralis from 'moralis'
import { MORALIS_API_KEY } from '@/config/constants'
import type { TokenBalance } from '@/types'

class MoralisService {
  private initialized = false

  async init() {
    if (!this.initialized && MORALIS_API_KEY) {
      try {
        await Moralis.start({
          apiKey: MORALIS_API_KEY
        })
        this.initialized = true
      } catch (error) {
        console.error('Moralis 初始化失败:', error)
      }
    }
  }

  // 获取钱包代币余额（Sepolia 测试网）
  async getWalletTokens(address: string): Promise<TokenBalance[]> {
    try {
      await this.init()
      
      const response = await Moralis.EvmApi.token.getWalletTokenBalances({
        address,
        chain: "0xaa36a7" // Sepolia 测试网
      })
      
      const tokens = response.toJSON()
      
      return tokens.map((token: any) => ({
        token_address: token.token_address,
        symbol: token.symbol || 'Unknown',
        name: token.name || 'Unknown Token',
        decimals: token.decimals || 18,
        balance: token.balance || '0',
      }))
    } catch (error) {
      console.error('获取代币余额失败:', error)
      return []
    }
  }
}

export const moralisService = new MoralisService()
