import React from 'react'
import { Card, Button, Table, Tag, Space, Typography, Tooltip } from 'antd'
import { PlusOutlined, WalletOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { useNavigateWithWallet } from '@/hooks/useNavigateWithWallet'
// import { useAccount } from 'wagmi' // 已移到 useTransactionManager 中
import { useMultiSigWallet } from '@/hooks/useMultiSigWallet'
import { useTransactionManager } from '@/hooks/useTransactionManager'
import { useContractAddress } from '@/hooks/useContractAddress'
import type { Transaction } from '@/types'

const { Title, Text } = Typography

export const Transactions: React.FC = () => {
  const navigate = useNavigateWithWallet()
  const contractAddress = useContractAddress()
  const { required } = useMultiSigWallet()
  const {
    transactions,
    loading,
    isOwner,
    confirmTransaction,
    revokeConfirmation,
    executeTransaction,
    isTxProcessing,
    isConfirmedByUser,
  } = useTransactionManager()



  if (!contractAddress) {
    return (
      <div className="p-6 text-center">
        <Card className="max-w-md mx-auto">
          <div className="py-8">
            <WalletOutlined className="text-6xl text-gray-400 mb-4" />
            <Title level={3}>请指定多签钱包地址</Title>
            <Text type="secondary">
              在 URL 中添加 wallet 参数来查看交易
            </Text>
          </div>
        </Card>
      </div>
    )
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '目标地址',
      dataIndex: 'to',
      key: 'to',
      render: (address: string) => (
        <Text code>{address.slice(0, 6)}...{address.slice(-4)}</Text>
      ),
    },
    {
      title: '金额',
      dataIndex: 'value',
      key: 'value',
      render: (value: string) => `${value} ETH`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors = {
          Pending: 'orange',
          Ready: 'blue',
          Executed: 'green',
          Failed: 'red',
        }
        return <Tag color={colors[status as keyof typeof colors]}>{status}</Tag>
      },
    },
    {
      title: '确认进度',
      dataIndex: 'confirmations',
      key: 'confirmations',
      render: (confirmations: number) => `${confirmations}/${required}`,
    },
    {
      title: '创建时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: number) => new Date(timestamp * 1000).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Transaction) => {
        const userConfirmed = isConfirmedByUser(record)
        const txProcessing = isTxProcessing(record.id)

        return (
          <Space>
            {record.status === 'Pending' && !userConfirmed && (
              <Button
                size="small"
                icon={<CheckOutlined />}
                disabled={!isOwner || txProcessing}
                loading={txProcessing}
                onClick={() => confirmTransaction(record.id)}
              >
                确认
              </Button>
            )}
            {record.status === 'Pending' && userConfirmed && (
              <Button
                size="small"
                icon={<CloseOutlined />}
                disabled={!isOwner || txProcessing}
                loading={txProcessing}
                onClick={() => revokeConfirmation(record.id)}
                danger
              >
                撤销
              </Button>
            )}
            {record.status === 'Ready' && (
              <Button
                type="primary"
                size="small"
                disabled={!isOwner || txProcessing}
                loading={txProcessing}
                onClick={() => executeTransaction(record.id)}
              >
                执行
              </Button>
            )}
            {record.confirmationAddresses && record.confirmationAddresses.length > 0 && (
              <Tooltip
                title={
                  <div>
                    <div>确认者:</div>
                    {record.confirmationAddresses.map((addr, idx) => (
                      <div key={idx}>{addr.slice(0, 6)}...{addr.slice(-4)}</div>
                    ))}
                  </div>
                }
              >
                <Button size="small" type="text">
                  详情
                </Button>
              </Tooltip>
            )}
          </Space>
        )
      },
    },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 页面头部 - 创建交易按钮在右上角 */}
      <div className="flex justify-between items-center mb-6">
        <Title level={2} className="mb-0">交易管理</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          className="bg-blue-500 hover:bg-blue-600"
          disabled={!isOwner}
          onClick={() => navigate('/create-transaction')}
        >
          创建交易
        </Button>
      </div>

      {/* 交易列表 */}
      <Card className="shadow-sm">
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          className="w-full"
          loading={loading}
          locale={{
            emptyText: (
              <div className="py-8">
                <Text type="secondary">暂无交易记录</Text>
              </div>
            )
          }}
        />
      </Card>
    </div>
  )
}
