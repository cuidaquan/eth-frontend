import { useAccount } from 'wagmi'
import { useContractBalance, useUserBalance, formatEthAmount } from '../hooks/useBankContract'

interface BalanceCardProps {
  enabled?: boolean
}

export function BalanceCard({ enabled = true }: BalanceCardProps) {
  const { address, isConnected } = useAccount()
  const { data: contractBalance, isLoading: contractLoading, error: contractError } = useContractBalance()
  const { data: userBalance, isLoading: userLoading, error: userError } = useUserBalance(address)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 合约总余额 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">合约总余额</h3>
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
        </div>
        
        <div className="space-y-2">
          {contractLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </div>
          ) : contractError ? (
            <div className="text-red-600 text-sm">加载失败</div>
          ) : (
            <div className="text-3xl font-bold text-gray-900">
              {contractBalance ? formatEthAmount(contractBalance) : '0.0000'} ETH
            </div>
          )}
          
          <div className="text-sm text-gray-500">
            银行合约中的总存款金额
          </div>
        </div>
      </div>

      {/* 当前账户余额 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">我的存款</h3>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        
        <div className="space-y-2">
          {!isConnected ? (
            <div className="text-gray-500 text-sm">请先连接钱包</div>
          ) : userLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-32"></div>
            </div>
          ) : userError ? (
            <div className="text-red-600 text-sm">加载失败</div>
          ) : (
            <div className="text-3xl font-bold text-gray-900">
              {userBalance ? formatEthAmount(userBalance) : '0.0000'} ETH
            </div>
          )}
          
          <div className="text-sm text-gray-500">
            {isConnected ? '您在银行中的存款余额' : '连接钱包后查看余额'}
          </div>
        </div>
      </div>
    </div>
  )
}
