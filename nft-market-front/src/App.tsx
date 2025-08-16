import { useState } from 'react'
import { useAccount, useDisconnect } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'
import NFTMarketplace from './components/NFTMarketplace'
import ListNFT from './components/ListNFT'
import MintTokens from './components/MintTokens'
import './index.css'

function App() {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'list' | 'mint'>('list')
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { open } = useAppKit()

  const handleConnect = () => {
    open()
  }

  const handleDisconnect = () => {
    disconnect()
  }

  return (
    <div className="container">
      <header className="header">
        <h1>NFT Market</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {isConnected && (
            <div className="nav">
              <button
                className={activeTab === 'marketplace' ? 'active' : ''}
                onClick={() => setActiveTab('marketplace')}
              >
                市场
              </button>
              <button
                className={activeTab === 'list' ? 'active' : ''}
                onClick={() => setActiveTab('list')}
              >
                上架 NFT
              </button>
              <button
                className={activeTab === 'mint' ? 'active' : ''}
                onClick={() => setActiveTab('mint')}
              >
                获取代币
              </button>
            </div>
          )}
          <div>
            {isConnected ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.9rem', color: '#ccc' }}>
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
                <button onClick={handleDisconnect}>断开连接</button>
              </div>
            ) : (
              <button onClick={handleConnect}>连接钱包</button>
            )}
          </div>
        </div>
      </header>

      <main>
        {!isConnected ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <h2>欢迎来到 NFT 市场</h2>
            <p>请连接您的钱包开始使用</p>
            <button onClick={handleConnect} style={{ marginTop: '1rem', fontSize: '1.1rem' }}>
              连接钱包
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'marketplace' && <NFTMarketplace />}
            {activeTab === 'list' && (
              <ListNFT onListedSuccess={() => setActiveTab('marketplace')} />
            )}
            {activeTab === 'mint' && <MintTokens />}
          </>
        )}
      </main>
    </div>
  )
}

export default App
