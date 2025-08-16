import { encodeFunctionData, parseUnits } from 'viem'

const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
  },
  {
    name: 'approve',
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
  },
] as const

export class TokenTransferService {
  // 创建ERC20转账的交易数据
  static createTransferData(recipientAddress: string, amount: string, decimals: number = 18) {
    return encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [recipientAddress as `0x${string}`, parseUnits(amount, decimals)],
    })
  }

  // 创建ERC20授权的交易数据
  static createApprovalData(spenderAddress: string, amount: string, decimals: number = 18) {
    return encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spenderAddress as `0x${string}`, parseUnits(amount, decimals)],
    })
  }
}
