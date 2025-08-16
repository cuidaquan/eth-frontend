import React from 'react'
import { Card, Button, Form, Input, InputNumber, Typography, Space, Alert } from 'antd'
import { ArrowLeftOutlined, WalletOutlined } from '@ant-design/icons'
import { useNavigateWithWallet } from '@/hooks/useNavigateWithWallet'
import { useMultiSigWallet } from '@/hooks/useMultiSigWallet'
import { useIsOwner } from '@/hooks/useIsOwner'
import { useTransactionHandler } from '@/hooks/useTransactionHandler'
import { useContractAddress } from '@/hooks/useContractAddress'
import { multiSigWalletAbi } from '@/generated'

const { Title, Text } = Typography

export const SendETH: React.FC = () => {
  const navigate = useNavigateWithWallet()
  const contractAddress = useContractAddress()
  const { balance } = useMultiSigWallet()
  const isOwner = useIsOwner()
  const { submitTransaction, isLoading } = useTransactionHandler()
  const [form] = Form.useForm()

  const handleSubmit = async (values: any) => {
    if (!contractAddress) return

    await submitTransaction(
      {
        address: contractAddress,
        abi: multiSigWalletAbi,
        functionName: 'submitTransaction',
        args: [values.recipient, BigInt(Math.floor(values.amount * 1e18)), '0x'],
      },
      {
        onSuccess: () => {
          navigate('/transactions')
        },
        successMessage: 'ETH 转账交易创建成功！',
        errorMessage: '创建 ETH 转账失败，请重试'
      }
    )
  }

  const handleMaxAmount = () => {
    // 预留一些 ETH 作为 Gas 费用
    const maxAmount = Math.max(0, parseFloat(balance) - 0.01)
    form.setFieldsValue({ amount: maxAmount })
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="flex items-center mb-6">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} className="mr-4">
          返回
        </Button>
        <Title level={2} className="mb-0">发送 ETH</Title>
      </div>

      {/* 余额显示卡片 */}
      <Card className="mb-6 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <WalletOutlined className="text-2xl text-blue-500" />
            <div>
              <Text className="text-sm text-gray-600">当前余额</Text>
              <div className="text-2xl font-bold text-blue-600">{balance} ETH</div>
            </div>
          </div>
          <Button type="link" onClick={handleMaxAmount}>
            使用最大金额
          </Button>
        </div>
      </Card>

      <Card className="shadow-sm">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
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
            label="ETH 数量"
            name="amount"
            rules={[
              { required: true, message: '请输入 ETH 数量' },
              { type: 'number', min: 0.000001, message: '数量必须大于 0' }
            ]}
          >
            <InputNumber
              min={0}
              max={parseFloat(balance)}
              step={0.001}
              precision={6}
              className="w-full"
              size="large"
              placeholder="0.0"
              addonAfter="ETH"
            />
          </Form.Item>



          <Alert
            message="提示"
            description="创建交易后需要其他多签持有人确认才能执行。请确保接收地址正确。"
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
                disabled={!isOwner}
                size="large"
              >
                创建转账交易
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
