import React from 'react'
import { Card, Typography, List, Tag } from 'antd'
import { WalletOutlined, UserOutlined, SafetyOutlined } from '@ant-design/icons'
import { useMultiSigWallet } from '@/hooks/useMultiSigWallet'
import { useContractAddress } from '@/hooks/useContractAddress'

const { Title, Text } = Typography

export const Settings: React.FC = () => {
  const contractAddress = useContractAddress()
  const { owners, required } = useMultiSigWallet()

  if (!contractAddress) {
    return (
      <div className="p-6 text-center">
        <Card className="max-w-md mx-auto">
          <div className="py-8">
            <WalletOutlined className="text-6xl text-gray-400 mb-4" />
            <Title level={3}>请指定多签钱包地址</Title>
            <Text type="secondary">
              在 URL 中添加 wallet 参数来查看设置
            </Text>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Title level={2} className="mb-6">钱包设置</Title>

      {/* 多签配置信息 */}
      <Card title="多签配置" className="shadow-sm mb-6" extra={<SafetyOutlined />}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Text strong>合约地址:</Text>
            <Text code className="text-sm">{contractAddress}</Text>
          </div>
          
          <div className="flex items-center justify-between">
            <Text strong>签名门槛:</Text>
            <Tag color="blue" className="text-base px-3 py-1">
              {required} of {owners.length}
            </Tag>
          </div>
          
          <div className="flex items-center justify-between">
            <Text strong>持有人数量:</Text>
            <Text className="text-lg font-semibold">{owners.length}</Text>
          </div>
        </div>
      </Card>

      {/* 持有人列表 */}
      <Card title="多签持有人" className="shadow-sm" extra={<UserOutlined />}>
        <List
          dataSource={owners as string[]}
          renderItem={(owner: string, index) => (
            <List.Item>
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Text strong className="text-blue-600">{index + 1}</Text>
                  </div>
                  <div>
                    <Text strong>持有人 {index + 1}</Text>
                    <div className="text-sm text-gray-500">
                      {owner.slice(0, 6)}...{owner.slice(-4)}
                    </div>
                  </div>
                </div>
                <Text code className="text-xs">{owner}</Text>
              </div>
            </List.Item>
          )}
          locale={{
            emptyText: '暂无持有人信息'
          }}
        />
      </Card>
    </div>
  )
}
