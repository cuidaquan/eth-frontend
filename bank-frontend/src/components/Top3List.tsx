import { useTopDepositors, formatEthAmount, shortenAddress } from '../hooks/useBankContract'

const RANK_COLORS = ['text-yellow-600', 'text-gray-600', 'text-orange-600']
const RANK_ICONS = ['🥇', '🥈', '🥉']

interface Top3ListProps {
  enabled?: boolean
}

export function Top3List({ enabled = true }: Top3ListProps) {
  const { data: topDepositors, isLoading, error } = useTopDepositors(enabled)

  const copyAddress = async (address: string) => {
    await navigator.clipboard.writeText(address)
    // 这里可以添加一个 toast 提示
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">存款排行榜 Top 3</h3>
      
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">
          加载排行榜失败
        </div>
      ) : !topDepositors || topDepositors.every(d => d.amount === 0n) ? (
        <div className="text-center py-8 text-gray-500">
          暂无存款记录
        </div>
      ) : (
        <div className="space-y-3">
          {topDepositors.map((depositor, index) => {
            // 跳过金额为 0 的记录
            if (depositor.amount === 0n) {
              return (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg opacity-50">
                  <div className="w-8 h-8 flex items-center justify-center text-lg">
                    {RANK_ICONS[index]}
                  </div>
                  <div className="flex-1">
                    <div className="text-gray-400 text-sm">暂无数据</div>
                  </div>
                </div>
              )
            }

            return (
              <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 flex items-center justify-center text-lg">
                  {RANK_ICONS[index]}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyAddress(depositor.depositor)}
                      className="font-mono text-sm text-gray-700 hover:text-gray-900 transition-colors"
                      title="点击复制地址"
                    >
                      {shortenAddress(depositor.depositor)}
                    </button>
                    <svg 
                      className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  
                  <div className={`text-lg font-semibold ${RANK_COLORS[index]}`}>
                    {formatEthAmount(depositor.amount)} ETH
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-xs text-gray-500">第 {index + 1} 名</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
      
      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
        <div className="text-sm text-yellow-800">
          <strong>说明:</strong> 排行榜实时更新，显示存款金额最多的前三名用户。
        </div>
      </div>
    </div>
  )
}
