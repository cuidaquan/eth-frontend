import { createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { injected, walletConnect } from 'wagmi/connectors'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || ''

export const config = createConfig({
  chains: [sepolia],
  connectors: [
    injected(),
    walletConnect({
      projectId,
      metadata: {
        name: 'MultiSig Wallet',
        description: 'Multi-signature wallet application',
        url: 'https://multisig-wallet.vercel.app',
        icons: ['https://multisig-wallet.vercel.app/icon.png']
      }
    }),
  ],
  transports: {
    [sepolia.id]: http(),
  },
})
