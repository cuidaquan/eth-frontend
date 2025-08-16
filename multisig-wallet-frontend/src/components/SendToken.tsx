import React, { useState, useEffect } from 'react'
import { Card, Button, Form, Input, InputNumber, Select, Typography, Space, Alert } from 'antd'
import { ArrowLeftOutlined, SwapOutlined } from '@ant-design/icons'
import { useLocation } from 'react-router-dom'
import { useNavigateWithWallet } from '@/hooks/useNavigateWithWallet'
// import { useMultiSigWallet } from '@/hooks/useMultiSigWallet' // 暂时不需要
import { useWalletStore } from '@/store/walletStore'
import { useIsOwner } from '@/hooks/useIsOwner'
import { useTransactionHandler } from '@/hooks/useTransactionHandler'
import { useContractAddress } from '@/hooks/useContractAddress'
import { multiSigWalletAbi } from '@/generated'
import { formatTokenBalance, getTokenBalanceNumber } from '@/utils/tokenUtils'
import { TokenTransferService } from '@/services/tokenService'
import type { TokenBalance } from '@/types'

const { Title, Text } = Typography
const { Option } = Select

export const SendToken: React.FC = () => {
  const navigate = useNavigateWithWallet()
  const location = useLocation()
  const contractAddress = useContractAddress()
  const { tokenBalances } = useWalletStore()
  const isOwner = useIsOwner()
  const { submitTransaction, isLoading } = useTransactionHandler()
  const [form] = Form.useForm()
  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>(null)

  // 从路由状态中获取预选的代币
  useEffect(() => {
    const preSelectedToken = location.state?.selectedToken
    if (preSelectedToken) {
      setSelectedToken(preSelectedToken)
      form.setFieldsValue({ tokenAddress: preSelectedToken.token_address })
    }
  }, [location.state, form])

  const handleTokenSelect = (tokenAddress: string) => {
    const token = tokenBalances.find(t => t.token_address === tokenAddress)
    setSelectedToken(token || null)
    form.setFieldsValue({ tokenAddress })
  }

  const handleSubmit = async (values: any) => {
    if (!selectedToken || !contractAddress) return

    const data = TokenTransferService.createTransferData(
      values.recipient,
      values.amount.toString(),
      selectedToken.decimals
    )

    await submitTransaction(
      {
        address: contractAddress,
        abi: multiSigWalletAbi,
        functionName: 'submitTransaction',
        args: [selectedToken.token_address, BigInt(0), data],
      },
      {
        onSuccess: () => {
          navigate('/transactions')
        },
        successMessage: '代币转账交易创建成功！',
        errorMessage: '创建代币转账失败，请重试'
      }
    )
  }

  const handleMaxAmount = () => {
    if (selectedToken) {
      const maxAmount = getTokenBalanceNumber(selectedToken.balance, selectedToken.decimals)
      form.setFieldsValue({ amount: maxAmount })
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="flex items-center mb-6">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} className="mr-4">
          返回
        </Button>
        <Title level={2} className="mb-0">发送代币</Title>
      </div>

      {/* 选中代币信息 */}
      {selectedToken && (
        <Card className="mb-6 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <SwapOutlined className="text-2xl text-green-500" />
              <div>
                <div className="font-bold text-lg">{selectedToken.symbol}</div>
                <Text className="text-sm text-gray-600">{selectedToken.name}</Text>
                <div className="text-xl font-bold text-green-600">
                  余额: {formatTokenBalance(selectedToken.balance, selectedToken.decimals)}
                </div>
              </div>
            </div>
            <Button type="link" onClick={handleMaxAmount}>
              使用最大金额
            </Button>
          </div>
        </Card>
      )}

      <Card className="shadow-sm">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="选择代币"
            name="tokenAddress"
            rules={[{ required: true, message: '请选择要发送的代币' }]}
          >
            <Select
              placeholder="选择代币"
              size="large"
              onChange={handleTokenSelect}
            >
              {tokenBalances.map(token => (
                <Option key={token.token_address} value={token.token_address}>
                  <div className="flex justify-between items-center">
                    <span>
                      <strong>{token.symbol}</strong> - {token.name}
                    </span>
                    <span className="text-gray-500">
                      余额: {formatTokenBalance(token.balance, token.decimals)}
                    </span>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="接收地址"
            name="recipient"
            rules={[
              { required: true, message: '请输入接收地址' },
              { pattern: /^0x[a-fA-F0-9]{40}$/, message: '请输入有效的以太坊地址' }
            ]}
          >
            <Input 
              placeholder="0x..." 
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="代币数量"
            name="amount"
            rules={[
              { required: true, message: '请输入代币数量' },
              { type: 'number', min: 0.000001, message: '数量必须大于 0' }
            ]}
          >
            <InputNumber
              min={0}
              max={selectedToken ? getTokenBalanceNumber(selectedToken.balance, selectedToken.decimals) : undefined}
              className="w-full"
              size="large"
              placeholder="0.0"
              addonAfter={selectedToken?.symbol || '代币'}
            />
          </Form.Item>



          <Alert
            message="提示"
            description="创建交易后需要其他多签持有人确认才能执行。请确保接收地址和代币数量正确。"
            type="info"
            showIcon
            className="mb-4"
          />

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button size="large" onClick={() => navigate(-1)}>
                取消
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                size="large"
                disabled={!selectedToken || !isOwner}
              >
                创建代币转账
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
