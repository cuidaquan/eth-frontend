// 网络配置
export const SEPOLIA_CHAIN_ID = 11155111

// Moralis API 配置
export const MORALIS_API_KEY = import.meta.env.VITE_MORALIS_API_KEY

// 合约相关常量
export const TRANSACTION_STATUS = {
  0: 'Pending',    // 待确认
  1: 'Ready',      // 可执行
  2: 'Executed',   // 已执行
  3: 'Failed'      // 执行失败
} as const

export type TransactionStatus = keyof typeof TRANSACTION_STATUS
