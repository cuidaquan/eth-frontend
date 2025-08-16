import { useState, useEffect, useRef } from 'react'
import { useAccount } from 'wagmi'
import { isAddress } from 'viem'
import { useAdmin, useContractBalance, useBankContract, formatEthAmount } from '../hooks/useBankContract'
import { useToastContext } from './Toast'

interface AdminPanelProps {
  enabled?: boolean
}

export function AdminPanel({ enabled = true }: AdminPanelProps) {
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [newAdmin, setNewAdmin] = useState('')
  const [showChangeAdmin, setShowChangeAdmin] = useState(false)
  const [confirmAction, setConfirmAction] = useState<string | null>(null)

  const { address, isConnected } = useAccount()
  const { data: adminAddress } = useAdmin(enabled)
  const { data: contractBalance } = useContractBalance(enabled)
  const { withdraw, withdrawAll, changeAdmin, hash, isPending, isConfirming, isConfirmed, error } = useBankContract()
  const toast = useToastContext()

  // 使用 ref 跟踪已显示的通知，避免重复
  const notifiedStates = useRef<{
    hash?: string
    isConfirming?: boolean
    isConfirmed?: boolean
    error?: string
  }>({})

  // 监听交易状态变化
  useEffect(() => {
    if (hash && isPending && notifiedStates.current.hash !== hash) {
      toast.info('交易已发送', `交易哈希: ${hash.slice(0, 10)}...`)
      notifiedStates.current.hash = hash
    }
  }, [hash, isPending, toast])

  useEffect(() => {
    if (isConfirming && hash && !notifiedStates.current.isConfirming) {
      toast.info('交易确认中', '请等待区块链确认...')
      notifiedStates.current.isConfirming = true
    }
  }, [isConfirming, hash, toast])

  useEffect(() => {
    if (isConfirmed && hash && !notifiedStates.current.isConfirmed) {
      toast.success('操作成功', '管理员操作已完成')
      setConfirmAction(null)
      setWithdrawAmount('')
      setNewAdmin('')
      setShowChangeAdmin(false)
      notifiedStates.current.isConfirmed = true
    }
  }, [isConfirmed, hash, toast])

  useEffect(() => {
    if (error && notifiedStates.current.error !== error.message) {
      toast.error('操作失败', error.message)
      notifiedStates.current.error = error.message
    }
  }, [error, toast])

  // 重置通知状态当开始新交易时
  useEffect(() => {
    if (!hash) {
      notifiedStates.current = {}
    }
  }, [hash])

  // 检查当前用户是否为管理员
  const isAdmin = isConnected && address && adminAddress && 
    address.toLowerCase() === adminAddress.toLowerCase()

  if (!isConnected) {
    return null
  }

  if (!isAdmin) {
    return null
  }

  const handleWithdraw = () => {
    if (confirmAction === 'withdraw') {
      withdraw(withdrawAmount)
      setConfirmAction(null)
      setWithdrawAmount('')
    } else {
      setConfirmAction('withdraw')
    }
  }

  const handleWithdrawAll = () => {
    if (confirmAction === 'withdrawAll') {
      withdrawAll()
      setConfirmAction(null)
    } else {
      setConfirmAction('withdrawAll')
    }
  }

  const handleChangeAdmin = () => {
    if (confirmAction === 'changeAdmin') {
      changeAdmin(newAdmin as `0x${string}`)
      setConfirmAction(null)
      setNewAdmin('')
      setShowChangeAdmin(false)
    } else {
      setConfirmAction('changeAdmin')
    }
  }

  const cancelConfirm = () => {
    setConfirmAction(null)
  }

  const isValidAddress = (addr: string) => {
    return isAddress(addr)
  }

  const isValidAmount = (amount: string) => {
    const num = parseFloat(amount)
    return !isNaN(num) && num > 0
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-red-800">管理员面板</h3>
        <div className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
          管理员权限
        </div>
      </div>

      <div className="space-y-6">
        {/* 提取指定金额 */}
        <div className="bg-white rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-3">提取指定金额</h4>
          
          <div className="flex space-x-3">
            <input
              type="number"
              step="0.0001"
              min="0"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="输入提取金额 (ETH)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            
            <button
              onClick={handleWithdraw}
              disabled={isPending || isConfirming || !isValidAmount(withdrawAmount)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                confirmAction === 'withdraw'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              } disabled:bg-gray-400`}
            >
              {isPending || isConfirming ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isPending ? '发送中...' : '确认中...'}
                </>
              ) : (
                confirmAction === 'withdraw' ? '确认提取' : '提取'
              )}
            </button>
            
            {confirmAction === 'withdraw' && (
              <button
                onClick={cancelConfirm}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                取消
              </button>
            )}
          </div>
          
          {contractBalance && contractBalance > 0n ? (
            <div className="mt-2 text-sm text-gray-600">
              合约余额: {formatEthAmount(contractBalance)} ETH
            </div>
          ) : null}
        </div>

        {/* 提取全部 */}
        <div className="bg-white rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-3">提取全部资金</h4>
          
          <div className="flex space-x-3">
            <button
              onClick={handleWithdrawAll}
              disabled={isPending || isConfirming || !contractBalance || contractBalance === 0n}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                confirmAction === 'withdrawAll'
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              } disabled:bg-gray-400`}
            >
              {isPending || isConfirming ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isPending ? '发送中...' : '确认中...'}
                </>
              ) : (
                confirmAction === 'withdrawAll' ? '确认提取全部' : '提取全部'
              )}
            </button>
            
            {confirmAction === 'withdrawAll' && (
              <button
                onClick={cancelConfirm}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                取消
              </button>
            )}
          </div>
        </div>

        {/* 更换管理员 */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-800">更换管理员</h4>
            <button
              onClick={() => setShowChangeAdmin(!showChangeAdmin)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {showChangeAdmin ? '隐藏' : '显示'}
            </button>
          </div>
          
          {showChangeAdmin && (
            <div className="space-y-3">
              <input
                type="text"
                value={newAdmin}
                onChange={(e) => setNewAdmin(e.target.value)}
                placeholder="输入新管理员地址 (0x...)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              
              <div className="flex space-x-3">
                <button
                  onClick={handleChangeAdmin}
                  disabled={isPending || isConfirming || !isValidAddress(newAdmin)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center ${
                    confirmAction === 'changeAdmin'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  } disabled:bg-gray-400`}
                >
                  {isPending || isConfirming ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {isPending ? '发送中...' : '确认中...'}
                    </>
                  ) : (
                    confirmAction === 'changeAdmin' ? '确认更换' : '更换管理员'
                  )}
                </button>
                
                {confirmAction === 'changeAdmin' && (
                  <button
                    onClick={cancelConfirm}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    取消
                  </button>
                )}
              </div>
              
              <div className="text-xs text-red-600">
                ⚠️ 警告: 更换管理员后，您将失去管理员权限，请确保新地址正确！
              </div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
          <div className="text-sm text-red-700">
            操作失败: {error.message}
          </div>
        </div>
      )}

      {isPending && (
        <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
          <div className="text-sm text-blue-700">
            交易进行中，请等待确认...
          </div>
        </div>
      )}
    </div>
  )
}
