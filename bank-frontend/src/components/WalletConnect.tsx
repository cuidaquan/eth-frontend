import { useAccount, useDisconnect, useSwitchChain } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { sepolia } from 'wagmi/chains'
import { TARGET_CHAIN_ID } from '../lib/contract'
import { shortenAddress } from '../hooks/useBankContract'

export function WalletConnect() {
  const { address, isConnected, chain } = useAccount()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()

  const isWrongNetwork = isConnected && chain?.id !== TARGET_CHAIN_ID

  const handleSwitchNetwork = () => {
    switchChain({ chainId: sepolia.id })
  }

  return (
    <div className="flex items-center gap-4">
      {isWrongNetwork && (
        <div className="flex items-center gap-2">
          <span className="text-red-600 text-sm">网络不匹配</span>
          <button
            onClick={handleSwitchNetwork}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
          >
            切换到 Sepolia
          </button>
        </div>
      )}

      <ConnectButton />
    </div>
  )
}
