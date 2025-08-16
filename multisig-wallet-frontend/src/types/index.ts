export interface Transaction {
  id: number
  to: string
  value: string
  data: string
  status: 'Pending' | 'Ready' | 'Executed' | 'Failed'
  confirmations: number
  timestamp: number
  confirmationAddresses?: string[]
}

export interface TokenBalance {
  token_address: string
  symbol: string
  name: string
  logo?: string
  decimals: number
  balance: string
}

export interface WalletInfo {
  address: string
  balance: string
  owners: string[]
  required: number
  transactionCount: number
}
