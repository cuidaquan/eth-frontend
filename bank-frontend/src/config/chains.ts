import { sepolia } from 'wagmi/chains'
import { http } from 'viem'

export const supportedChains = [sepolia]

export const chainConfig = {
  [sepolia.id]: {
    chain: sepolia,
    transport: http(import.meta.env.VITE_RPC_URL || 'https://sepolia.infura.io/v3/dca2a8416ac24058860426614449251d')
  }
}
