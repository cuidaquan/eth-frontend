import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Transaction, TokenBalance } from '@/types'
import { moralisService } from '@/services/moralisService'

interface WalletState {
  // 状态
  ethBalance: string
  tokenBalances: TokenBalance[]
  transactions: Transaction[]
  loading: boolean
  
  // 操作
  setEthBalance: (balance: string) => void
  setTokenBalances: (balances: TokenBalance[]) => void
  setTransactions: (transactions: Transaction[]) => void
  setLoading: (loading: boolean) => void
  
  // 异步操作
  loadTokenBalances: (address: string) => Promise<void>
}

export const useWalletStore = create<WalletState>()(
  devtools(
    (set) => ({
      // 初始状态
      ethBalance: '0',
      tokenBalances: [],
      transactions: [],
      loading: false,
      
      // 同步操作
      setEthBalance: (balance) => set({ ethBalance: balance }),
      setTokenBalances: (balances) => set({ tokenBalances: balances }),
      setTransactions: (transactions) => set({ transactions }),
      setLoading: (loading) => set({ loading }),
      
      // 异步操作
      loadTokenBalances: async (address: string) => {
        set({ loading: true })
        try {
          const balances = await moralisService.getWalletTokens(address)
          set({ tokenBalances: balances, loading: false })
        } catch (error) {
          console.error('加载代币余额失败:', error)
          set({ loading: false })
        }
      },
    }),
    { name: 'wallet-store' }
  )
)
