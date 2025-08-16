import React, { useEffect } from 'react'
import { Card, Button, Typography, Spin } from 'antd'
import { WalletOutlined } from '@ant-design/icons'
import { useNavigateWithWallet } from '@/hooks/useNavigateWithWallet'
import { useMultiSigWallet } from '@/hooks/useMultiSigWallet'
import { useWalletStore } from '@/store/walletStore'
import { useContractAddress } from '@/hooks/useContractAddress'
import { useIsOwner } from '@/hooks/useIsOwner'
import { formatTokenBalance, isZeroBalance } from '@/utils/tokenUtils'

const { Title, Text } = Typography

export const Assets: React.FC = () => {
  const navigate = useNavigateWithWallet()
  const contractAddress = useContractAddress()
  const { balance } = useMultiSigWallet()
  const { tokenBalances, loading, loadTokenBalances } = useWalletStore()
  const isOwner = useIsOwner()

  // 加载代币余额
  useEffect(() => {
    if (contractAddress) {
      loadTokenBalances(contractAddress)
    }
  }, [contractAddress, loadTokenBalances])

  if (!contractAddress) {
    return (
      <div className="p-6 text-center">
        <Card className="max-w-md mx-auto">
          <div className="py-8">
            <WalletOutlined className="text-6xl text-gray-400 mb-4" />
            <Title level={3}>请指定多签钱包地址</Title>
            <Text type="secondary">
              在 URL 中添加 wallet 参数来查看资产
            </Text>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Title level={2} className="mb-6">资产管理</Title>

      {/* ETH 余额卡片 */}
      <Card title="ETH 余额" className="shadow-sm mb-6">
        <div className="flex items-center justify-between">
          <div>
            <Title level={2} className="mb-0">{balance} ETH</Title>
            <Text type="secondary">以太坊余额</Text>
          </div>
          <Button
            type="primary"
            size="large"
            disabled={!balance || parseFloat(balance) === 0 || !isOwner}
            onClick={() => navigate('/send-eth')}
          >
            发送 ETH
          </Button>
        </div>
      </Card>

      {/* 代币资产列表 - 去除图标 */}
      <Card title="代币资产" className="shadow-sm">
        {loading ? (
          <div className="text-center py-8">
            <Spin size="large" />
            <div className="mt-4">
              <Text type="secondary">加载代币余额中...</Text>
            </div>
          </div>
        ) : tokenBalances.length > 0 ? (
          <div className="space-y-4">
            {tokenBalances.map(token => (
              <div 
                key={token.token_address} 
                className="flex items-center justify-between p-3 hover:bg-gray-50 rounded border"
              >
                <div>
                  <Text strong className="text-lg">{token.symbol}</Text>
                  <div className="text-sm text-gray-500">{token.name}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {token.token_address.slice(0, 6)}...{token.token_address.slice(-4)}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <Text strong className="text-lg">
                      {formatTokenBalance(token.balance, token.decimals)}
                    </Text>
                    <div className="text-xs text-gray-500">{token.decimals} decimals</div>
                  </div>
                  <Button
                    size="middle"
                    disabled={isZeroBalance(token.balance) || !isOwner}
                    onClick={() => navigate('/send-token', {
                      state: { selectedToken: token }
                    })}
                  >
                    发送
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Text type="secondary">暂无代币资产</Text>
          </div>
        )}
      </Card>
    </div>
  )
}
