import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { message } from 'antd'

/**
 * 通用的交易处理 hook
 * 处理交易提交、等待确认、显示结果
 */
export function useTransactionHandler() {
  const [pendingOptions, setPendingOptions] = useState<{
    onSuccess?: () => void
    onError?: (error: Error) => void
    successMessage?: string
    errorMessage?: string
  } | null>(null)

  const { writeContract, data: hash, error, isPending } = useWriteContract()

  const { isLoading: isConfirming, isSuccess, isError } = useWaitForTransactionReceipt({
    hash,
  })

  // 监听交易结果
  useEffect(() => {
    if (!pendingOptions) return

    if (isSuccess) {
      message.success(pendingOptions.successMessage || '交易成功！')
      pendingOptions.onSuccess?.()
      setPendingOptions(null)
    } else if (isError) {
      message.error(pendingOptions.errorMessage || '交易失败，请重试')
      pendingOptions.onError?.(new Error('Transaction failed'))
      setPendingOptions(null)
    }
  }, [isSuccess, isError, pendingOptions])

  // 提交交易
  const submitTransaction = async (
    contractCall: Parameters<typeof writeContract>[0],
    options?: {
      onSuccess?: () => void
      onError?: (error: Error) => void
      successMessage?: string
      errorMessage?: string
    }
  ) => {
    try {
      setPendingOptions(options || null)
      writeContract(contractCall)
    } catch (err) {
      console.error('Transaction error:', err)
      message.error(options?.errorMessage || '交易失败，请重试')
      options?.onError?.(err as Error)
      setPendingOptions(null)
    }
  }

  return {
    submitTransaction,
    isLoading: isPending || isConfirming,
    hash,
    isSuccess,
    isError,
    error
  }
}
