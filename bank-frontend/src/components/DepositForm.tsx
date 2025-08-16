import { useState, useEffect, useRef } from 'react'
import { useAccount, useBalance } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { useBankContract } from '../hooks/useBankContract'
import { useToastContext } from './Toast'

interface DepositFormProps {
  onSuccess?: () => void
}

export function DepositForm({ onSuccess }: DepositFormProps) {
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')

  const { address, isConnected } = useAccount()
  const { data: ethBalance } = useBalance({ address })
  const { deposit, hash, isPending, isConfirming, isConfirmed, error: contractError } = useBankContract()
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
      toast.success('存款成功', `成功存入 ${amount} ETH`)
      setAmount('')
      setError('')
      onSuccess?.()
      notifiedStates.current.isConfirmed = true
    }
  }, [isConfirmed, hash, amount, toast, onSuccess])

  useEffect(() => {
    if (contractError && notifiedStates.current.error !== contractError.message) {
      toast.error('交易失败', contractError.message)
      notifiedStates.current.error = contractError.message
    }
  }, [contractError, toast])

  // 重置通知状态当开始新交易时
  useEffect(() => {
    if (!hash) {
      notifiedStates.current = {}
    }
  }, [hash])

  const validateAmount = (value: string): string => {
    if (!value || value === '0') {
      return '请输入存款金额'
    }
    
    const numValue = parseFloat(value)
    if (isNaN(numValue) || numValue <= 0) {
      return '请输入有效的正数'
    }
    
    if (ethBalance && parseEther(value) > ethBalance.value) {
      return '余额不足'
    }
    
    return ''
  }

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAmount(value)
    setError(validateAmount(value))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateAmount(amount)
    if (validationError) {
      setError(validationError)
      return
    }
    
    deposit(amount)
  }

  const setMaxAmount = () => {
    if (ethBalance) {
      // 预留一些 ETH 用于 gas 费用
      const maxAmount = ethBalance.value - parseEther('0.01')
      if (maxAmount > 0) {
        const maxAmountStr = formatEther(maxAmount)
        setAmount(maxAmountStr)
        setError(validateAmount(maxAmountStr))
      }
    }
  }

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">存款</h3>
        <div className="text-center py-8 text-gray-500">
          请先连接钱包以进行存款
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">存款</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
            存款金额 (ETH)
          </label>
          
          <div className="relative">
            <input
              id="amount"
              type="number"
              step="0.0001"
              min="0"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.0000"
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                error ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            
            <button
              type="button"
              onClick={setMaxAmount}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              最大
            </button>
          </div>
          
          {ethBalance && (
            <div className="mt-1 text-sm text-gray-500">
              钱包余额: {parseFloat(formatEther(ethBalance.value)).toFixed(4)} ETH
            </div>
          )}
          
          {error && (
            <div className="mt-1 text-sm text-red-600">{error}</div>
          )}
          
          {contractError && (
            <div className="mt-1 text-sm text-red-600">
              交易失败: {contractError.message}
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={isPending || isConfirming || !!error || !amount}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
        >
          {isPending || isConfirming ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isPending ? '发送交易中...' : '确认中...'}
            </>
          ) : (
            '存款'
          )}
        </button>
      </form>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-sm text-blue-800">
          <strong>提示:</strong> 存款将被记录在区块链上，交易确认后您的存款将显示在余额中。
        </div>
      </div>
    </div>
  )
}
