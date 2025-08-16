import { useTransactionHistory } from '../hooks/useTransactionHistory'
import { shortenAddress } from '../hooks/useBankContract'

interface TransactionHistoryProps {
  enabled?: boolean
}

export function TransactionHistory({ enabled = true }: TransactionHistoryProps) {
  const {
    transactions,
    isLoading,
    lastSyncedBlock,
    clearCache,
    refetch
  } = useTransactionHistory(enabled)

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return '未知时间'
    return new Date(timestamp).toLocaleString('zh-CN')
  }

  const openInExplorer = (hash: string) => {
    window.open(`https://sepolia.etherscan.io/tx/${hash}`, '_blank')
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">交易历史</h3>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            已同步到区块: {lastSyncedBlock.toString()}
          </span>
          <button
            onClick={refetch}
            disabled={isLoading}
            className="text-blue-600 hover:text-blue-700 text-xs disabled:text-gray-400"
            title="刷新交易历史"
          >
            🔄 刷新
          </button>
          <button
            onClick={clearCache}
            className="text-red-600 hover:text-red-700 text-xs"
            title="清除缓存"
          >
            🗑️ 清除缓存
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-16 h-6 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="w-20 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          暂无交易记录
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                tx.type === 'deposit'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {tx.type === 'deposit' ? '存款' : '提取'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm text-gray-700">
                    {shortenAddress(tx.user as `0x${string}`)}
                  </span>
                  <span className={`font-semibold ${
                    tx.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {tx.type === 'deposit' ? '+' : '-'}{tx.amount} ETH
                  </span>
                </div>

                <div className="text-xs text-gray-500">
                  {formatTimestamp(tx.blockTimestamp)}
                </div>
              </div>

              <button
                onClick={() => openInExplorer(tx.transactionHash)}
                className="text-blue-600 hover:text-blue-700 text-xs"
                title="在区块浏览器中查看"
              >
                查看详情
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-sm text-blue-800">
          <strong>说明:</strong> 交易记录已缓存在浏览器中，显示最近 50 条记录。新交易会自动添加到列表顶部。点击"查看详情"可在 Etherscan 上查看完整交易信息。
        </div>
      </div>
    </div>
  )
}
