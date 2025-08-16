import { useState } from 'react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'

import '@rainbow-me/rainbowkit/styles.css'
import { sepolia } from 'wagmi/chains'
import { WalletConnect } from './components/WalletConnect'
import { BalanceCard } from './components/BalanceCard'
import { DepositForm } from './components/DepositForm'
import { Top3List } from './components/Top3List'
import { TransactionHistory } from './components/TransactionHistory'
import { AdminPanel } from './components/AdminPanel'
import { ToastProvider, useToastContext } from './components/Toast'
import { useDepositEvents, useWithdrawEvents, useTopDepositorsUpdatedEvents } from './hooks/useBankContract'
import { useTransactionHistory } from './hooks/useTransactionHistory'

// 配置 wagmi
const config = getDefaultConfig({
  appName: 'Bank DApp',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '1435f78e564b6364a19be11d61069db2',
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(import.meta.env.VITE_RPC_URL || 'https://rpc.sepolia.org'),
  },
})

// 创建 QueryClient 并配置缓存
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // 30秒内数据被认为是新鲜的
      gcTime: 300000, // 5分钟后清理缓存
      refetchOnWindowFocus: false, // 窗口聚焦时不自动重新获取
    },
  },
})

type TabType = 'overview' | 'deposit' | 'ranking' | 'history' | 'admin'

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const toast = useToastContext()
  const { addTransaction } = useTransactionHistory()

  // 监听合约事件以自动刷新数据
  useDepositEvents((depositor, amount, event) => {
    console.log('Deposit event:', { depositor, amount, event })
    toast.success('存款成功', `用户 ${depositor.slice(0, 6)}...${depositor.slice(-4)} 存入了 ${(Number(amount) / 1e18).toFixed(4)} ETH`)

    // 添加到交易历史缓存
    if (event?.blockNumber && event?.transactionHash) {
      addTransaction({
        type: 'deposit',
        user: depositor,
        amount: (Number(amount) / 1e18).toFixed(4),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        blockTimestamp: Date.now()
      })
    }

    queryClient.invalidateQueries({ queryKey: ['readContract'] })
  })

  useWithdrawEvents((admin, amount, event) => {
    console.log('Withdraw event:', { admin, amount, event })
    toast.info('管理员提取', `管理员提取了 ${(Number(amount) / 1e18).toFixed(4)} ETH`)

    // 添加到交易历史缓存
    if (event?.blockNumber && event?.transactionHash) {
      addTransaction({
        type: 'withdraw',
        user: admin,
        amount: (Number(amount) / 1e18).toFixed(4),
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        blockTimestamp: Date.now()
      })
    }

    queryClient.invalidateQueries({ queryKey: ['readContract'] })
  })

  useTopDepositorsUpdatedEvents(() => {
    console.log('Top depositors updated')
    queryClient.invalidateQueries({ queryKey: ['readContract'] })
  })

  const tabs = [
    { id: 'overview', name: '概览', icon: '📊' },
    { id: 'deposit', name: '存款', icon: '💰' },
    { id: 'ranking', name: '排行榜', icon: '🏆' },
    { id: 'history', name: '交易历史', icon: '📜' },
    { id: 'admin', name: '管理员', icon: '👑' },
  ] as const

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <BalanceCard enabled={true} />
          </div>
        )
      case 'deposit':
        return (
          <div className="max-w-2xl">
            <DepositForm />
          </div>
        )
      case 'ranking':
        return (
          <div className="max-w-2xl">
            <Top3List enabled={activeTab === 'ranking'} />
          </div>
        )
      case 'history':
        return (
          <div>
            <TransactionHistory enabled={activeTab === 'history'} />
          </div>
        )
      case 'admin':
        return (
          <div className="max-w-2xl">
            <AdminPanel enabled={activeTab === 'admin'} />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部导航 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Bank DApp</h1>
              <div className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                Sepolia 测试网
              </div>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Tab 导航 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderTabContent()}
      </main>



      {/* 页脚 */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>Bank DApp - 基于以太坊的去中心化银行应用</p>
            <p className="mt-2">
              合约地址: 
              <a 
                href={`https://sepolia.etherscan.io/address/${import.meta.env.VITE_BANK_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-blue-600 hover:text-blue-700 font-mono"
              >
                {import.meta.env.VITE_BANK_ADDRESS}
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
