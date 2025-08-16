import { useState, useEffect } from 'react'
import { formatEther, parseEther } from 'viem'
import { CONTRACTS } from '../contracts/config'
import { TOKEN_BANK_ABI, EXTENDED_ERC20_ABI } from '../contracts/abis'
import { useWallet } from './useWallet'

interface TokenBankData {
  tokenBalance: string
  bankBalance: string
  isLoading: boolean
}

interface TransactionState {
  isLoading: boolean
  error: string | null
  success: string | null
}

export function useTokenBank() {
  const { address, publicClient, walletClient, isConnected } = useWallet()
  const [data, setData] = useState<TokenBankData>({
    tokenBalance: '0',
    bankBalance: '0',
    isLoading: false
  })
  const [txState, setTxState] = useState<TransactionState>({
    isLoading: false,
    error: null,
    success: null
  })

  // 读取合约数据
  const fetchData = async () => {
    if (!address || !publicClient) return

    setData(prev => ({ ...prev, isLoading: true }))

    try {
      const [tokenBalance, bankBalance] = await Promise.all([
        // 读取用户 Token 余额
        publicClient.readContract({
          address: CONTRACTS.EXTENDED_ERC20,
          abi: EXTENDED_ERC20_ABI,
          functionName: 'balanceOf',
          args: [address as `0x${string}`]
        }),
        // 读取用户在 TokenBank 的存款余额
        publicClient.readContract({
          address: CONTRACTS.TOKEN_BANK,
          abi: TOKEN_BANK_ABI,
          functionName: 'getBalance',
          args: [address as `0x${string}`]
        })
      ])

      setData({
        tokenBalance: formatEther(tokenBalance as bigint),
        bankBalance: formatEther(bankBalance as bigint),
        isLoading: false
      })
    } catch (error) {
      console.error('获取数据失败:', error)
      setData(prev => ({ ...prev, isLoading: false }))
    }
  }

  // 存款（使用 transferWithCallback）
  const deposit = async (amount: string) => {
    if (!walletClient || !address) return

    setTxState({ isLoading: true, error: null, success: null })

    try {
      const hash = await walletClient.writeContract({
        address: CONTRACTS.EXTENDED_ERC20,
        abi: EXTENDED_ERC20_ABI,
        functionName: 'transferWithCallback',
        // 直接调用3参重载，避免2参重载内部使用 this. 调用导致 msg.sender 变为合约地址
        args: [CONTRACTS.TOKEN_BANK, parseEther(amount), '0x'],
        account: address as `0x${string}`
      })

      // 等待交易确认
      await publicClient.waitForTransactionReceipt({ hash })

      setTxState({ isLoading: false, error: null, success: '存款成功！' })
      await fetchData() // 刷新数据
    } catch (error: any) {
      setTxState({
        isLoading: false,
        error: error.message || '存款失败',
        success: null
      })
    }
  }

  // 取款
  const withdraw = async (amount: string) => {
    if (!walletClient || !address) return

    setTxState({ isLoading: true, error: null, success: null })

    try {
      const hash = await walletClient.writeContract({
        address: CONTRACTS.TOKEN_BANK,
        abi: TOKEN_BANK_ABI,
        functionName: 'withdraw',
        args: [parseEther(amount)],
        account: address as `0x${string}`
      })

      // 等待交易确认
      await publicClient.waitForTransactionReceipt({ hash })

      setTxState({ isLoading: false, error: null, success: '取款成功！' })
      await fetchData() // 刷新数据
    } catch (error: any) {
      setTxState({
        isLoading: false,
        error: error.message || '取款失败',
        success: null
      })
    }
  }

  // Mint 代币（管理员功能）
  const mint = async (toAddress: string, amount: string) => {
    if (!walletClient || !address) return

    setTxState({ isLoading: true, error: null, success: null })

    try {
      const hash = await walletClient.writeContract({
        address: CONTRACTS.EXTENDED_ERC20,
        abi: EXTENDED_ERC20_ABI,
        functionName: 'mint',
        args: [toAddress as `0x${string}`, parseEther(amount)],
        account: address as `0x${string}`
      })

      // 等待交易确认
      await publicClient.waitForTransactionReceipt({ hash })

      setTxState({ isLoading: false, error: null, success: 'Mint 成功！' })
      await fetchData() // 刷新数据
    } catch (error: any) {
      let errorMessage = 'Mint 失败'
      if (error.message?.includes('OwnableUnauthorizedAccount')) {
        errorMessage = '只有合约拥有者才能铸造代币'
      } else if (error.message) {
        errorMessage = error.message
      }
      setTxState({
        isLoading: false,
        error: errorMessage,
        success: null
      })
    }
  }

  // 清除消息
  const clearMessage = () => {
    setTxState(prev => ({ ...prev, error: null, success: null }))
  }

  // 当连接状态或地址变化时重新获取数据
  useEffect(() => {
    if (isConnected && address) {
      fetchData()
    } else {
      // 断开连接时清除数据
      setData({
        tokenBalance: '0',
        bankBalance: '0',
        isLoading: false
      })
      setTxState({
        isLoading: false,
        error: null,
        success: null
      })
    }
  }, [isConnected, address])



  return {
    ...data,
    ...txState,
    deposit,
    withdraw,
    mint,
    clearMessage,
    refetch: fetchData
  }
}
