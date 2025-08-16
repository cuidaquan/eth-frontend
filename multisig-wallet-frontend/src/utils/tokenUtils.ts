/**
 * 代币工具函数
 */

/**
 * 格式化代币余额 - 从原始余额转换为可读的小数格式
 * @param balance 原始余额字符串（如 "1000000000000000000"）
 * @param decimals 代币小数位数（如 18）
 * @returns 格式化后的余额字符串（如 "1.000000"）
 */
export function formatTokenBalance(balance: string, decimals: number): string {
  if (!balance || balance === '0') return '0'
  
  const balanceNumber = parseFloat(balance)
  const formattedBalance = balanceNumber / Math.pow(10, decimals)
  
  return formattedBalance.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6
  })
}

/**
 * 获取代币的实际余额数值（用于计算和比较）
 * @param balance 原始余额字符串
 * @param decimals 代币小数位数
 * @returns 实际余额数值
 */
export function getTokenBalanceNumber(balance: string, decimals: number): number {
  if (!balance || balance === '0') return 0
  
  const balanceNumber = parseFloat(balance)
  return balanceNumber / Math.pow(10, decimals)
}

/**
 * 检查代币余额是否为零
 * @param balance 原始余额字符串
 * @returns 是否为零余额
 */
export function isZeroBalance(balance: string): boolean {
  return !balance || balance === '0' || parseFloat(balance) === 0
}

/**
 * 将用户输入的代币数量转换为原始格式（用于合约调用）
 * @param amount 用户输入的数量
 * @param decimals 代币小数位数
 * @returns 原始格式的数量字符串
 */
export function parseTokenAmount(amount: number, decimals: number): string {
  const rawAmount = Math.floor(amount * Math.pow(10, decimals))
  return rawAmount.toString()
}
