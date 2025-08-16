import { FC } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { config } from '@/config/wagmi'
import { useTransactionEvents } from '@/hooks/useTransactionEvents'
import { Layout } from '@/components/Layout'
import { Dashboard } from '@/components/Dashboard'
import { Assets } from '@/components/Assets'
import { Transactions } from '@/components/Transactions'
import { CreateTransaction } from '@/components/CreateTransaction'
import { SendETH } from '@/components/SendETH'
import { SendToken } from '@/components/SendToken'
import { Settings } from '@/components/Settings'

// 创建 React Query 客户端
const queryClient = new QueryClient()

// 内部组件，用于事件监听
function AppContent() {
  useTransactionEvents() // 启用事件监听

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Dashboard />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/create-transaction" element={<CreateTransaction />} />
        <Route path="/send-eth" element={<SendETH />} />
        <Route path="/send-token" element={<SendToken />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  )
}

const App: FC = () => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider locale={zhCN}>
          <Router>
            <AppContent />
          </Router>
        </ConfigProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
