import React from 'react'
import { Card, Row, Col, Button, Typography, Avatar, Badge } from 'antd'
import { WalletOutlined, HistoryOutlined } from '@ant-design/icons'
import { useNavigateWithWallet } from '@/hooks/useNavigateWithWallet'
// import { useAccount } from 'wagmi' // 暂时不需要
import { useMultiSigWallet } from '@/hooks/useMultiSigWallet'
import { useContractAddress } from '@/hooks/useContractAddress'
import { useIsOwner } from '@/hooks/useIsOwner'

const { Title, Text } = Typography

export const Dashboard: React.FC = () => {
  const navigate = useNavigateWithWallet()
  // const { address } = useAccount() // 暂时不需要
  const contractAddress = useContractAddress()
  const { balance, owners, required, transactionCount } = useMultiSigWallet()
  const isOwner = useIsOwner()

  // 如果没有合约地址，显示提示
  if (!contractAddress) {
    return (
      <div className="p-6 text-center">
        <Card className="max-w-md mx-auto">
          <div className="py-8">
            <WalletOutlined className="text-6xl text-gray-400 mb-4" />
            <Title level={3}>请指定多签钱包地址</Title>
            <Text type="secondary" className="block mb-4">
              在 URL 中添加 wallet 参数来指定要管理的多签钱包
            </Text>
            <Text code className="text-sm">
              ?wallet=0x9e25904178979cb0Aa04E13e1D291e5d3B4FE000
            </Text>
            <div className="mt-4 text-xs text-gray-500">
              此应用需要通过 URL 参数指定要管理的多签钱包合约地址
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 钱包概览卡片 */}
      <Card className="mb-6 shadow-sm">
        <Row gutter={24} align="middle">
          <Col span={4}>
            <Avatar size={64} icon={<WalletOutlined />} className="bg-green-500" />
          </Col>
          <Col span={12}>
            <Title level={4} className="mb-1">多签钱包</Title>
            <Text type="secondary" className="text-sm block">
              {contractAddress.slice(0, 10)}...{contractAddress.slice(-8)}
            </Text>
            <div className="mt-2">
              <Badge 
                count={`${required} of ${owners.length}`} 
                className="bg-blue-500"
              />
              <Text className="ml-2 text-sm text-gray-500">签名门槛</Text>
            </div>
          </Col>
          <Col span={8} className="text-right">
            <Title level={3} className="mb-0">{balance} ETH</Title>
            <Text type="secondary">钱包余额</Text>
          </Col>
        </Row>
      </Card>

      {/* 快速操作区域 - 单个创建交易按钮 */}
      <div className="mb-6 text-center">
        <Card className="inline-block hover:shadow-md transition-shadow">
          <div className="p-4">
            <HistoryOutlined className="text-3xl text-blue-500 mb-3" />
            <Title level={4} className="mb-3">创建交易</Title>
            <Button
              type="primary"
              size="large"
              className="px-8"
              disabled={!isOwner}
              onClick={() => navigate('/create-transaction')}
            >
              创建新交易
            </Button>
            {!isOwner && (
              <div className="mt-2 text-xs text-gray-500">
                仅多签持有人可创建交易
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 统计信息卡片 */}
      <Row gutter={16}>
        <Col span={8}>
          <Card className="text-center">
            <div className="text-2xl font-bold text-blue-600">{owners.length}</div>
            <Text type="secondary">持有人数量</Text>
          </Card>
        </Col>
        <Col span={8}>
          <Card className="text-center">
            <div className="text-2xl font-bold text-green-600">{required}</div>
            <Text type="secondary">所需签名</Text>
          </Card>
        </Col>
        <Col span={8}>
          <Card className="text-center">
            <div className="text-2xl font-bold text-orange-600">{transactionCount}</div>
            <Text type="secondary">总交易数</Text>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
