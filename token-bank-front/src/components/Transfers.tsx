import { useState } from 'react'
import { useTransfers, TransferRecord } from '../hooks/useTransfers'

interface TransfersProps {
  address: string | null
}

export function Transfers({ address }: TransfersProps) {
  const { transfers, isLoading, error, hasMore, loadTransfers, loadMore, refresh, clearError } = useTransfers(address)
  const [selectedDirection, setSelectedDirection] = useState<'all' | 'sent' | 'received'>('all')

  // 格式化地址显示
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  // 格式化时间显示
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('zh-CN')
  }

  // 格式化金额显示
  const formatAmount = (value: string) => {
    const num = parseFloat(value)
    if (num === 0) return '0'
    if (num < 0.0001) return '< 0.0001'
    return num.toLocaleString('zh-CN', { maximumFractionDigits: 4 })
  }

  // 判断转账方向
  const getTransferDirection = (transfer: TransferRecord) => {
    if (!address || !transfer.from || !transfer.to) return 'unknown'
    const userAddress = address.toLowerCase()
    const fromAddress = transfer.from.toLowerCase()
    const toAddress = transfer.to.toLowerCase()

    if (fromAddress === userAddress && toAddress === userAddress) {
      return 'self' // 自转
    } else if (fromAddress === userAddress) {
      return 'sent' // 发送
    } else if (toAddress === userAddress) {
      return 'received' // 接收
    }
    return 'unknown'
  }

  // 获取方向显示文本和样式
  const getDirectionDisplay = (transfer: TransferRecord) => {
    const direction = getTransferDirection(transfer)
    switch (direction) {
      case 'sent':
        return { text: '发送', color: '#dc3545', symbol: '-' }
      case 'received':
        return { text: '接收', color: '#28a745', symbol: '+' }
      case 'self':
        return { text: '自转', color: '#6c757d', symbol: '↔' }
      default:
        return { text: '未知', color: '#6c757d', symbol: '?' }
    }
  }

  // 获取对方地址
  const getCounterpartyAddress = (transfer: TransferRecord) => {
    if (!address || !transfer.from || !transfer.to) return transfer.to || '未知'
    const userAddress = address.toLowerCase()
    const fromAddress = transfer.from.toLowerCase()
    const toAddress = transfer.to.toLowerCase()

    if (fromAddress === userAddress && toAddress === userAddress) {
      return '自己' // 自转
    } else if (fromAddress === userAddress) {
      return transfer.to // 发送给谁
    } else {
      return transfer.from // 从谁接收
    }
  }

  // 处理方向筛选
  const handleDirectionChange = (direction: 'all' | 'sent' | 'received') => {
    setSelectedDirection(direction)
    loadTransfers(direction)
  }

  // 打开Etherscan
  const openEtherscan = (txHash: string) => {
    window.open(`https://sepolia.etherscan.io/tx/${txHash}`, '_blank')
  }

  if (!address) {
    return (
      <div className="card">
        <h3>转账记录</h3>
        <p style={{ color: '#666', textAlign: 'center', padding: '40px 20px' }}>
          请先连接钱包查看转账记录
        </p>
      </div>
    )
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3>转账记录</h3>
        <button 
          onClick={refresh} 
          disabled={isLoading}
          style={{
            padding: '6px 12px',
            fontSize: '0.9rem',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1
          }}
        >
          {isLoading ? '刷新中...' : '刷新'}
        </button>
      </div>

      {/* 方向筛选 */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[
            { key: 'all', label: '全部' },
            { key: 'received', label: '接收' },
            { key: 'sent', label: '发送' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleDirectionChange(key as any)}
              style={{
                padding: '6px 16px',
                fontSize: '0.9rem',
                background: selectedDirection === key ? '#007bff' : '#f8f9fa',
                color: selectedDirection === key ? 'white' : '#495057',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="error" style={{ marginBottom: '20px' }}>
          {error}
          <button 
            onClick={clearError}
            style={{ 
              marginLeft: '10px', 
              padding: '2px 8px', 
              fontSize: '0.8rem',
              background: 'transparent',
              border: '1px solid currentColor',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            关闭
          </button>
        </div>
      )}

      {/* 加载状态 */}
      {isLoading && transfers.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
          加载中...
        </div>
      )}

      {/* 空状态 */}
      {!isLoading && transfers.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
          暂无转账记录
        </div>
      )}

      {/* 转账记录列表 */}
      {transfers.length > 0 && (
        <div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {transfers.filter(transfer => transfer && transfer.txHash && transfer.from && transfer.to).map((transfer, index) => {
              const direction = getDirectionDisplay(transfer)
              const counterparty = getCounterpartyAddress(transfer)
              
              return (
                <div
                  key={`${transfer.txHash}-${transfer.logIndex}`}
                  style={{
                    border: '1px solid #dee2e6',
                    borderRadius: '8px',
                    padding: '16px',
                    background: '#fff'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <span 
                        style={{ 
                          color: direction.color, 
                          fontWeight: 'bold',
                          fontSize: '0.9rem'
                        }}
                      >
                        {direction.symbol} {direction.text}
                      </span>
                      <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '2px' }}>
                        {counterparty === '自己' ? '自己' : `${formatAddress(counterparty)}`}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', color: direction.color }}>
                        {direction.symbol}{formatAmount(transfer.value)} ETK
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px' }}>
                        {formatTime(transfer.timestamp)}
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '0.8rem', color: '#666', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>区块 #{transfer.blockNumber}</span>
                    <button
                      onClick={() => openEtherscan(transfer.txHash)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#007bff',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        textDecoration: 'underline'
                      }}
                    >
                      查看交易 ↗
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 加载更多按钮 */}
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                onClick={loadMore}
                disabled={isLoading}
                style={{
                  padding: '10px 20px',
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.6 : 1
                }}
              >
                {isLoading ? '加载中...' : '加载更多'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
