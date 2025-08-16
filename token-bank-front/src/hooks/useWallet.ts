import { useState, useEffect } from 'react'
import { createWalletClient, custom, createPublicClient, http } from 'viem'
import { sepolia } from 'viem/chains'

// 钱包状态类型
interface WalletState {
  isConnected: boolean
  address: string | null
  isConnecting: boolean
  error: string | null
}

// 声明 window.ethereum 类型
declare global {
  interface Window {
    ethereum?: any
  }
}

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    isConnecting: false,
    error: null
  })

  // 创建公共客户端（用于读取数据）
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(`https://sepolia.infura.io/v3/${import.meta.env.VITE_INFURA_KEY || 'YOUR_INFURA_KEY'}`)
  })

  // 创建钱包客户端（用于发送交易）
  const walletClient = walletState.isConnected && window.ethereum ? 
    createWalletClient({
      chain: sepolia,
      transport: custom(window.ethereum)
    }) : null

  // 检查是否已连接
  useEffect(() => {
    checkConnection()
  }, [])

  // 监听账户变化
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    }
  }, [])

  const checkConnection = async () => {
    if (!window.ethereum) {
      setWalletState(prev => ({ ...prev, error: '请安装 MetaMask' }))
      return
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (accounts.length > 0) {
        setWalletState({
          isConnected: true,
          address: accounts[0],
          isConnecting: false,
          error: null
        })
      }
    } catch (error) {
      console.error('检查连接失败:', error)
    }
  }

  const connect = async () => {
    if (!window.ethereum) {
      setWalletState(prev => ({ ...prev, error: '请安装 MetaMask' }))
      return
    }

    setWalletState(prev => ({ ...prev, isConnecting: true, error: null }))

    try {
      let accounts

      try {
        // 方法1: 使用 wallet_requestPermissions 强制弹出账户选择器
        await window.ethereum.request({
          method: 'wallet_requestPermissions',
          params: [{ eth_accounts: {} }]
        })
        accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      } catch (permissionError) {
        // 方法2: 如果权限请求失败，回退到标准方法
        console.log('Permission request failed, using fallback method')
        accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
      }

      // 检查网络
      const chainId = await window.ethereum.request({ method: 'eth_chainId' })
      if (chainId !== '0xaa36a7') { // Sepolia chain ID
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],
          })
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            // 网络不存在，添加网络
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0xaa36a7',
                chainName: 'Sepolia Test Network',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: ['https://sepolia.infura.io/v3/'],
                blockExplorerUrls: ['https://sepolia.etherscan.io/']
              }]
            })
          }
        }
      }

      setWalletState({
        isConnected: true,
        address: accounts[0],
        isConnecting: false,
        error: null
      })
    } catch (error: any) {
      setWalletState({
        isConnected: false,
        address: null,
        isConnecting: false,
        error: error.message || '连接失败'
      })
    }
  }

  const disconnect = async () => {
    try {
      // 尝试撤销权限（如果支持的话）
      if (window.ethereum && window.ethereum.request) {
        try {
          await window.ethereum.request({
            method: 'wallet_revokePermissions',
            params: [{ eth_accounts: {} }]
          })
        } catch (error) {
          // 如果不支持撤销权限，忽略错误
          console.log('Revoke permissions not supported or failed:', error)
        }
      }
    } catch (error) {
      console.log('Disconnect error:', error)
    }

    setWalletState({
      isConnected: false,
      address: null,
      isConnecting: false,
      error: null
    })
  }

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      disconnect()
    } else {
      setWalletState(prev => ({ ...prev, address: accounts[0] }))
    }
  }

  const handleChainChanged = () => {
    // 重新加载页面以确保状态一致
    window.location.reload()
  }

  return {
    ...walletState,
    connect,
    disconnect,
    publicClient,
    walletClient
  }
}
