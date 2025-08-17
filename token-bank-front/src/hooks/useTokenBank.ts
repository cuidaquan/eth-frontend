import { useState, useEffect } from 'react'
import { formatEther, parseEther } from 'viem'
import { CONTRACTS } from '../contracts/config'
import { TOKEN_BANK_ABI, EXTENDED_ERC20_ABI } from '../contracts/abis'
import { useWallet } from './useWallet'
import {
  PermitTransferFrom,
  SignatureTransfer
} from '@uniswap/permit2-sdk'

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

interface ContractAddresses {
  tokenAddress: `0x${string}` | null
  permit2Address: `0x${string}` | null
}

// 生成唯一 nonce
function generateUniqueNonce(): bigint {
  const timestamp = BigInt(Math.floor(Date.now() / 1000))
  const random = BigInt(Math.floor(Math.random() * 1000))
  return timestamp * 1000n + random
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
  const [contractAddresses, setContractAddresses] = useState<ContractAddresses>({
    tokenAddress: CONTRACTS.TOKEN,
    permit2Address: CONTRACTS.PERMIT2
  })

  // 合约地址现在直接从配置获取，无需动态查询

  // 读取合约数据（添加错误处理，避免频繁调用）
  const fetchData = async () => {
    if (!address || !publicClient || !contractAddresses.tokenAddress) return

    setData(prev => ({ ...prev, isLoading: true }))

    try {
      const [tokenBalance, bankBalance] = await Promise.all([
        // 读取用户 Token 余额
        publicClient.readContract({
          address: contractAddresses.tokenAddress,
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
    } catch (error: any) {
      console.error('获取数据失败:', error)

      // 如果是429错误，设置错误信息但不重试
      if (error.status === 429 || error.message?.includes('Too Many Requests')) {
        setTxState(prev => ({
          ...prev,
          error: 'RPC请求过多，请稍后再试。转账记录通过后端API获取，不受影响。'
        }))
      }

      setData(prev => ({ ...prev, isLoading: false }))
    }
  }

  // 存款（使用 transferWithCallback）
  const deposit = async (amount: string) => {
    if (!walletClient || !address || !contractAddresses.tokenAddress) return

    setTxState({ isLoading: true, error: null, success: null })

    try {
      const hash = await walletClient.writeContract({
        address: contractAddresses.tokenAddress,
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

  // Permit2 存款
  const depositWithPermit2 = async (amount: string) => {
    if (!walletClient || !address || !publicClient || !contractAddresses.tokenAddress || !contractAddresses.permit2Address) return

    setTxState({ isLoading: true, error: null, success: null })

    try {
      // 1. 检查用户是否已经授权 Permit2 合约
      const allowance = await publicClient.readContract({
        address: contractAddresses.tokenAddress,
        abi: EXTENDED_ERC20_ABI,
        functionName: 'allowance',
        args: [address as `0x${string}`, contractAddresses.permit2Address]
      }) as bigint

      // 如果授权不足，需要先授权（授权最大值，一次性解决）
      const requiredAmount = parseEther(amount)
      if (allowance < requiredAmount) {
        // 授权最大值 (2^256 - 1)，这样用户只需要授权一次
        const maxAmount = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
        const approveHash = await walletClient.writeContract({
          address: contractAddresses.tokenAddress,
          abi: EXTENDED_ERC20_ABI,
          functionName: 'approve',
          args: [contractAddresses.permit2Address, maxAmount],
          account: address as `0x${string}`
        })
        await publicClient.waitForTransactionReceipt({ hash: approveHash })
      }

      // 2. 生成唯一 nonce 并创建 Permit2 签名
      const nonce = generateUniqueNonce()
      const chainId = await publicClient.getChainId()
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600) // 1小时后过期

      // 构建 permit 数据
      const permitTransfer: PermitTransferFrom = {
        permitted: {
          token: contractAddresses.tokenAddress,
          amount: parseEther(amount),
        },
        spender: CONTRACTS.TOKEN_BANK,
        nonce,
        deadline,
      }

      // 使用官方 SDK 获取签名数据
      const { domain, types, values } = SignatureTransfer.getPermitData(
        permitTransfer,
        contractAddresses.permit2Address,
        chainId
      )

      // 创建签名
      const signature = await walletClient.signTypedData({
        account: address as `0x${string}`,
        domain: domain as any,
        types,
        primaryType: 'PermitTransferFrom',
        message: values as any,
      })

      // 3. 调用合约的 depositWithPermit2 函数
      const hash = await walletClient.writeContract({
        address: CONTRACTS.TOKEN_BANK,
        abi: TOKEN_BANK_ABI,
        functionName: 'depositWithPermit2',
        args: [
          {
            permitted: {
              token: permitTransfer.permitted.token as `0x${string}`,
              amount: BigInt(permitTransfer.permitted.amount.toString())
            },
            nonce: BigInt(permitTransfer.nonce.toString()),
            deadline: BigInt(permitTransfer.deadline.toString())
          },
          address as `0x${string}`,
          signature
        ],
        account: address as `0x${string}`
      })

      // 等待交易确认
      await publicClient.waitForTransactionReceipt({ hash })

      setTxState({ isLoading: false, error: null, success: 'Permit2 存款成功！' })
      await fetchData() // 刷新数据
    } catch (error: any) {
      console.error('Permit2 存款失败:', error)
      setTxState({
        isLoading: false,
        error: error.message || 'Permit2 存款失败',
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
    if (!walletClient || !address || !contractAddresses.tokenAddress) return

    setTxState({ isLoading: true, error: null, success: null })

    try {
      const hash = await walletClient.writeContract({
        address: contractAddresses.tokenAddress,
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

  // 合约地址已在初始化时设置，无需动态获取

  // 当连接状态或地址变化时重新获取数据（添加防抖，避免频繁调用）
  useEffect(() => {
    if (isConnected && address && contractAddresses.tokenAddress) {
      // 延迟执行，避免频繁调用
      const timer = setTimeout(() => {
        fetchData()
      }, 1000)

      return () => clearTimeout(timer)
    } else if (!isConnected) {
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
  }, [isConnected, address, contractAddresses.tokenAddress])



  return {
    ...data,
    ...txState,
    deposit,
    depositWithPermit2,
    withdraw,
    mint,
    clearMessage,
    refetch: fetchData
  }
}
