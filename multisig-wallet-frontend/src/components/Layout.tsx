import React from 'react'
import { Layout as AntLayout, Menu, Typography, Button } from 'antd'
import {
  DashboardOutlined,
  WalletOutlined,
  SwapOutlined,
  SettingOutlined,
  DisconnectOutlined
} from '@ant-design/icons'
import { useLocation } from 'react-router-dom'
import { useAccount, useDisconnect, useConnect } from 'wagmi'
import { useContractAddress } from '@/hooks/useContractAddress'
import { useNavigateWithWallet } from '@/hooks/useNavigateWithWallet'

const { Header, Sider, Content } = AntLayout
const { Title, Text } = Typography

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const navigateWithWallet = useNavigateWithWallet()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { connect, connectors } = useConnect()
  const contractAddress = useContractAddress()

  const menuItems = [
    {
      key: '/home',
      icon: <DashboardOutlined />,
      label: '概览',
      onClick: () => navigateWithWallet('/home'),
    },
    {
      key: '/assets',
      icon: <WalletOutlined />,
      label: '资产',
      onClick: () => navigateWithWallet('/assets'),
    },
    {
      key: '/transactions',
      icon: <SwapOutlined />,
      label: '交易',
      onClick: () => navigateWithWallet('/transactions'),
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigateWithWallet('/settings'),
    },
  ]

  return (
    <AntLayout className="min-h-screen">
      {/* 头部 */}
      <Header className="bg-white shadow-sm border-b flex items-center justify-between px-6">
        <div className="flex items-center">
          <Title level={3} className="mb-0 text-blue-600">
            多签钱包
          </Title>
        </div>
        
        <div className="flex items-center space-x-4">
          {contractAddress && (
            <div className="text-sm">
              <Text type="secondary">合约: </Text>
              <Text code>{contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}</Text>
            </div>
          )}
          
          {isConnected && address && (
            <div className="text-sm">
              <Text type="secondary">账户: </Text>
              <Text code>{address.slice(0, 6)}...{address.slice(-4)}</Text>
            </div>
          )}
          
          {isConnected ? (
            <Button
              icon={<DisconnectOutlined />}
              onClick={() => disconnect()}
              type="text"
            >
              断开连接
            </Button>
          ) : (
            <Button
              type="primary"
              onClick={() => connect({ connector: connectors[0] })}
            >
              连接钱包
            </Button>
          )}
        </div>
      </Header>

      <AntLayout>
        {/* 侧边栏 */}
        <Sider width={200} className="bg-white shadow-sm">
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            className="h-full border-r-0"
          />
        </Sider>

        {/* 主内容区域 */}
        <Content className="bg-gray-50">
          {children}
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
