import React from 'react'
import { Card, Button, Form, Input, InputNumber, Typography, Space, Alert, Tooltip } from 'antd'
import { ArrowLeftOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { useNavigateWithWallet } from '@/hooks/useNavigateWithWallet'
import { useMultiSigWallet } from '@/hooks/useMultiSigWallet'
import { useIsOwner } from '@/hooks/useIsOwner'
import { useTransactionHandler } from '@/hooks/useTransactionHandler'
import { isAddress } from 'viem'
import { multiSigWalletAbi } from '@/generated'
import { useContractAddress } from '@/hooks/useContractAddress'

const { Title, Text } = Typography

export const CreateTransaction: React.FC = () => {
  const navigate = useNavigateWithWallet()
  const contractAddress = useContractAddress()
  const { balance } = useMultiSigWallet()
  const isOwner = useIsOwner()
  const { submitTransaction, isLoading } = useTransactionHandler()
  const [form] = Form.useForm()

  const handleSubmit = async (values: any) => {
    if (!contractAddress) return

    const to = values.contractAddress
    const value = values.ethValue?.toString() || '0'
    const data = values.callData || '0x'

    await submitTransaction(
      {
        address: contractAddress,
        abi: multiSigWalletAbi,
        functionName: 'submitTransaction',
        args: [to, BigInt(value), data],
      },
      {
        onSuccess: () => {
          navigate('/transactions')
        },
        successMessage: '交易创建成功！',
        errorMessage: '创建交易失败，请重试'
      }
    )
  }

  // 验证十六进制数据格式
  const validateHexData = (_: any, value: string) => {
    if (!value) return Promise.resolve()
    if (!/^0x[0-9a-fA-F]*$/.test(value)) {
      return Promise.reject(new Error('请输入有效的十六进制数据（以 0x 开头）'))
    }
    return Promise.resolve()
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* 页面头部 */}
      <div className="flex items-center mb-6">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate(-1)} 
          className="mr-4"
        >
          返回
        </Button>
        <Title level={2} className="mb-0">创建交易</Title>
      </div>

      {/* 说明信息 */}
      <Alert
        message="合约调用交易"
        description="创建一个调用智能合约的多签交易。可以发送 ETH 并调用合约函数。"
        type="info"
        showIcon
        className="mb-6"
      />

      <Card className="shadow-sm">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* 目标合约地址 */}
          <Form.Item
            label={
              <span>
                目标合约地址
                <Tooltip title="要调用的智能合约地址">
                  <InfoCircleOutlined className="ml-1 text-gray-400" />
                </Tooltip>
              </span>
            }
            name="contractAddress"
            rules={[
              { required: true, message: '请输入合约地址' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve()
                  if (!isAddress(value)) {
                    return Promise.reject(new Error('请输入有效的以太坊地址'))
                  }
                  return Promise.resolve()
                }
              }
            ]}
          >
            <Input 
              placeholder="0x..." 
              size="large"
            />
          </Form.Item>

          {/* ETH 数量 */}
          <Form.Item
            label={
              <span>
                ETH 数量（可选）
                <Tooltip title="随交易一起发送的 ETH 数量，默认为 0">
                  <InfoCircleOutlined className="ml-1 text-gray-400" />
                </Tooltip>
              </span>
            }
            name="ethValue"
            initialValue={0}
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
          
          {/* 当前余额提示 */}
          <div className="mb-4 text-sm text-gray-500">
            当前钱包余额: {balance} ETH
          </div>

          {/* 调用数据 */}
          <Form.Item
            label={
              <span>
                调用数据
                <Tooltip title="合约函数调用的编码数据，以 0x 开头的十六进制格式">
                  <InfoCircleOutlined className="ml-1 text-gray-400" />
                </Tooltip>
              </span>
            }
            name="callData"
            rules={[
              { required: true, message: '请输入调用数据' },
              { validator: validateHexData }
            ]}
          >
            <Input.TextArea 
              rows={6} 
              placeholder="0x..."
              size="large"
            />
          </Form.Item>

          {/* 数据格式说明 */}
          <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
            <Text strong>调用数据格式说明：</Text>
            <ul className="mt-2 mb-0 text-gray-600">
              <li>• 必须以 "0x" 开头</li>
              <li>• 使用十六进制格式</li>
              <li>• 可以使用 Etherscan 或其他工具生成</li>
              <li>• 示例: 0xa9059cbb000000000000000000000000...</li>
            </ul>
          </div>



          {/* 重要提示 */}
          <Alert
            message="重要提示"
            description="请仔细检查合约地址和调用数据。交易创建后需要其他多签持有人确认才能执行。"
            type="warning"
            showIcon
            className="mb-6"
          />

          {/* 操作按钮 */}
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
                创建交易
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
