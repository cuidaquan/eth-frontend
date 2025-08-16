import { useState, useEffect } from 'react'
import { useWallet } from './hooks/useWallet'
import { useTokenBank } from './hooks/useTokenBank'

function App() {
  const { isConnected, address, connect, disconnect, isConnecting, error: walletError } = useWallet()
  const {
    tokenBalance,
    bankBalance,
    isLoading: dataLoading,
    isLoading: txLoading,
    error: txError,
    success: txSuccess,
    deposit,
    withdraw,
    mint,
    clearMessage
  } = useTokenBank()

  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [mintAmount, setMintAmount] = useState('')
  const [mintToAddress, setMintToAddress] = useState('')

  // 自动清除消息
  useEffect(() => {
    if (txSuccess || txError) {
      const timer = setTimeout(() => {
        clearMessage()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [txSuccess, txError, clearMessage])

  const handleDeposit = async () => {
    if (!depositAmount) return
    await deposit(depositAmount)
    setDepositAmount('')
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount) return
    await withdraw(withdrawAmount)
    setWithdrawAmount('')
  }

  const handleMint = async () => {
    if (!mintAmount || !mintToAddress) return
    await mint(mintToAddress, mintAmount)
    setMintAmount('')
    setMintToAddress('')
  }

  // 快速填入自己的地址
  const fillMyAddress = () => {
    if (address) {
      setMintToAddress(address)
    }
  }

  // 处理断开连接
  const handleDisconnect = async () => {
    // 清除所有表单数据
    setDepositAmount('')
    setWithdrawAmount('')
    setMintAmount('')
    setMintToAddress('')
    // 断开钱包连接
    await disconnect()
  }

  return (
    <div className="container">
      <div className="header">
        <h1>TokenBank DApp</h1>
        <p>使用纯 Viem 构建的代币银行应用</p>
      </div>

      <div className="card">
        <div className="wallet-section">
          {!isConnected || !address ? (
            <div>
              <h3>连接 MetaMask</h3>
              <p style={{ marginBottom: '20px', color: '#666' }}>
                点击下方按钮将弹出 MetaMask 让您选择要连接的账户
              </p>
              {walletError && (
                <div className="error" style={{ marginBottom: '20px' }}>
                  {walletError}
                </div>
              )}
              <button
                onClick={connect}
                disabled={isConnecting}
                className="connect-button"
              >
                {isConnecting ? '连接中...' : '连接 MetaMask'}
              </button>
            </div>
          ) : (
            <div>
              <div className="wallet-info">
                <p><strong>已连接地址:</strong> {address}</p>
                <button onClick={handleDisconnect} className="connect-button">
                  断开连接
                </button>
              </div>

              {txSuccess && (
                <div className="success">
                  {txSuccess}
                </div>
              )}

              {txError && (
                <div className="error">
                  {txError}
                </div>
              )}

              {dataLoading ? (
                <div className="loading">加载数据中...</div>
              ) : (
                <>
                  <div className="balance-grid">
                    <div className="balance-item">
                      <h3>Token 余额</h3>
                      <div className="amount">
                        {tokenBalance} ETK
                      </div>
                    </div>
                    <div className="balance-item">
                      <h3>银行存款</h3>
                      <div className="amount">
                        {bankBalance} ETK
                      </div>
                    </div>
                  </div>

                  <div className="actions">
                    <div className="action-section">
                      <h3>Mint 代币 <span style={{ fontSize: '0.7rem', color: '#dc3545' }}>(仅拥有者)</span></h3>
                      <div className="input-group">
                        <label>接收者地址</label>
                        <div style={{ display: 'flex', gap: '5px' }}>
                          <input
                            type="text"
                            value={mintToAddress}
                            onChange={(e) => setMintToAddress(e.target.value)}
                            placeholder="0x..."
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            onClick={fillMyAddress}
                            style={{
                              padding: '5px 10px',
                              fontSize: '0.8rem',
                              background: '#6c757d',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            我的
                          </button>
                        </div>
                      </div>
                      <div className="input-group">
                        <label>Mint 数量 (ETK)</label>
                        <input
                          type="number"
                          value={mintAmount}
                          onChange={(e) => setMintAmount(e.target.value)}
                          placeholder="输入 Mint 数量"
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <button
                        onClick={handleMint}
                        disabled={txLoading || !mintAmount || !mintToAddress}
                        className="action-button mint-button"
                      >
                        {txLoading ? '处理中...' : 'Mint 代币'}
                      </button>
                      <p style={{ fontSize: '0.8rem', color: '#dc3545', marginTop: '8px' }}>
                        ⚠️ 只有合约拥有者才能成功调用此功能
                      </p>
                    </div>

                    <div className="action-section">
                      <h3>存款</h3>
                      <div className="input-group">
                        <label>存款金额 (ETK)</label>
                        <input
                          type="number"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          placeholder="输入存款金额"
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <button
                        onClick={handleDeposit}
                        disabled={txLoading || !depositAmount}
                        className="action-button deposit-button"
                      >
                        {txLoading ? '处理中...' : '存款'}
                      </button>
                    </div>

                    <div className="action-section">
                      <h3>取款</h3>
                      <div className="input-group">
                        <label>取款金额 (ETK)</label>
                        <input
                          type="number"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          placeholder="输入取款金额"
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <button
                        onClick={handleWithdraw}
                        disabled={txLoading || !withdrawAmount}
                        className="action-button withdraw-button"
                      >
                        {txLoading ? '处理中...' : '取款'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
