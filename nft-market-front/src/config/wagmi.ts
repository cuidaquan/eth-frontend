import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { sepolia } from '@reown/appkit/networks'
import { QueryClient } from '@tanstack/react-query'

// 1. Get projectId from https://cloud.reown.com
// Project ID 已配置在 .env.local 文件中
export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '1435f78e564b6364a19be11d61069db2'

// 2. Create a metadata object - optional
const metadata = {
  name: 'NFT Market',
  description: 'NFT Marketplace with AppKit',
  url: 'https://nftmarket.example.com', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/179229932']
}

// 3. Set the networks
const networks = [sepolia]

// 4. Create Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: false
})

// 5. Create modal
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: networks as any,
  projectId,
  metadata,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
  }
})

export const config = wagmiAdapter.wagmiConfig

// 6. Create query client
export const queryClient = new QueryClient()
