import { useState, useEffect, useCallback } from 'react'

// 转账记录数据类型
export interface TransferRecord {
  txHash: string
  blockNumber: number
  timestamp: string
  from: string
  to: string
  valueRaw: string
  value: string
  tokenContract: string
}

// API响应类型
interface TransferResponse {
  data: TransferRecord[]
  nextCursor?: string
}

// 查询参数类型
interface TransferQueryParams {
  address: string
  direction?: 'sent' | 'received' | 'all'
  limit?: number
  cursor?: string
}

// Hook状态类型
interface TransferState {
  transfers: TransferRecord[]
  isLoading: boolean
  error: string | null
  hasMore: boolean
  nextCursor?: string
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

export function useTransfers(address: string | null) {
  const [state, setState] = useState<TransferState>({
    transfers: [],
    isLoading: false,
    error: null,
    hasMore: false,
    nextCursor: undefined
  })

  // 获取转账记录
  const fetchTransfers = useCallback(async (params: TransferQueryParams) => {
    if (!params.address) return

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const queryParams = new URLSearchParams({
        address: params.address,
        direction: params.direction || 'all',
        limit: (params.limit || 50).toString()
      })

      if (params.cursor) {
        queryParams.set('cursor', params.cursor)
      }

      const response = await fetch(`${BACKEND_URL}/api/transfers?${queryParams.toString()}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: TransferResponse = await response.json()

      setState(prev => ({
        ...prev,
        transfers: params.cursor ? [...prev.transfers, ...data.data] : data.data,
        hasMore: !!data.nextCursor,
        nextCursor: data.nextCursor,
        isLoading: false
      }))

    } catch (error: any) {
      console.error('获取转账记录失败:', error)
      setState(prev => ({
        ...prev,
        error: error.message || '获取转账记录失败',
        isLoading: false
      }))
    }
  }, [])

  // 加载初始数据
  const loadTransfers = useCallback((direction: 'sent' | 'received' | 'all' = 'all') => {
    if (!address) return
    
    setState(prev => ({ ...prev, transfers: [], nextCursor: undefined }))
    fetchTransfers({ address, direction })
  }, [address, fetchTransfers])

  // 加载更多数据
  const loadMore = useCallback(() => {
    if (!address || !state.nextCursor || state.isLoading) return
    
    fetchTransfers({ 
      address, 
      direction: 'all', 
      cursor: state.nextCursor 
    })
  }, [address, state.nextCursor, state.isLoading, fetchTransfers])

  // 刷新数据
  const refresh = useCallback(() => {
    if (!address) return
    
    setState(prev => ({ 
      ...prev, 
      transfers: [], 
      nextCursor: undefined,
      error: null 
    }))
    fetchTransfers({ address, direction: 'all' })
  }, [address, fetchTransfers])

  // 清除错误
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // 当地址变化时重新加载
  useEffect(() => {
    if (address) {
      loadTransfers()
    } else {
      setState({
        transfers: [],
        isLoading: false,
        error: null,
        hasMore: false,
        nextCursor: undefined
      })
    }
  }, [address, loadTransfers])

  return {
    transfers: state.transfers,
    isLoading: state.isLoading,
    error: state.error,
    hasMore: state.hasMore,
    loadTransfers,
    loadMore,
    refresh,
    clearError
  }
}
