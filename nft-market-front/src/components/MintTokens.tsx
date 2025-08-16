import React, { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther, isAddress } from 'viem'
import { ExtendedERC20ABI, EXTENDED_ERC20_ADDRESS } from '../contracts/ExtendedERC20'

const MintTokens: React.FC = () => {
  const { address } = useAccount()
  const [tokenAmount, setTokenAmount] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { writeContract, data: hash, isPending } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // 获取用户的代币余额
  const { data: tokenBalance } = useReadContract({
    address: EXTENDED_ERC20_ADDRESS,
    abi: ExtendedERC20ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  // 获取代币信息
  const { data: tokenName } = useReadContract({
    address: EXTENDED_ERC20_ADDRESS,
    abi: ExtendedERC20ABI,
    functionName: 'name',
  })

  const { data: tokenSymbol } = useReadContract({
    address: EXTENDED_ERC20_ADDRESS,
    abi: ExtendedERC20ABI,
    functionName: 'symbol',
  })

  // 获取合约owner
  const { data: tokenOwner } = useReadContract({
    address: EXTENDED_ERC20_ADDRESS,
    abi: ExtendedERC20ABI,
    functionName: 'owner',
  })



  // 检查用户是否是合约owner
  const isTokenOwner = address && tokenOwner && address.toLowerCase() === tokenOwner.toLowerCase()

  // Mint ERC20 代币（管理员为其他地址mint）
  const handleMintTokens = async () => {
    if (!tokenAmount || !recipientAddress) {
      setError('请输入代币数量和接收地址')
      return
    }

    try {
      setError('')
      setSuccess('')

      // 简单地址校验（也可在UI上做更严格的校验）
      if (!recipientAddress.startsWith('0x') || recipientAddress.length !== 42) {
        setError('请输入有效的以太坊地址')
        return
      }

      const amount = parseEther(tokenAmount)

      writeContract({
        address: EXTENDED_ERC20_ADDRESS,
        abi: ExtendedERC20ABI,
        functionName: 'mint',
        args: [recipientAddress as `0x${string}`, amount],
      })
    } catch (err: any) {
      setError(`Mint代币失败: ${err.message}`)
    }
  }



  // 监听交易确认
  useEffect(() => {
    if (isConfirmed) {
      setSuccess('Mint 成功！')
      setTokenAmount('')
      setRecipientAddress('')
    }
  }, [isConfirmed])

  return (
    <div>
      <h2>管理员发放测试代币</h2>
      
      <div className="card" style={{ marginBottom: '1rem', background: '#1a1a2e' }}>
        <h3>📋 使用说明</h3>
        <p>本页面仅用于管理员为用户发放测试代币：</p>
        <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.6' }}>
          <li><strong>ERC20代币</strong>：用于在市场中购买NFT</li>
          <li><strong>权限说明</strong>：只有合约owner可以发放代币</li>
        </ul>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {/* 当前余额信息 */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>💰 当前余额</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <p><strong>代币余额:</strong></p>
            <p style={{ fontSize: '1.2rem', color: '#4CAF50' }}>
              {tokenBalance ? formatEther(tokenBalance) : '0'} {tokenSymbol || 'TOKEN'}
            </p>
          </div>

        </div>
        <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '1rem' }}>
          合约Owner: {tokenOwner ? `${tokenOwner.slice(0, 6)}...${tokenOwner.slice(-4)}` : '加载中...'}
          {isTokenOwner && <span style={{ color: '#4CAF50', marginLeft: '0.5rem' }}>✓ 您是Owner</span>}
        </p>
      </div>

      <div className="card">
        <h3>🪙 Mint ERC20 代币（管理员为他人地址发放）</h3>
        <p style={{ color: '#ccc', marginBottom: '1rem' }}>
          管理员可以为任意地址发放 {tokenName || 'ExtendedERC20'} 代币
        </p>

        <div className="form-group">
          <label>接收地址 (Recipient Address):</label>
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="0x 开头的以太坊地址"
            disabled={!isTokenOwner}
          />
        </div>

        <div className="form-group">
          <label>代币数量:</label>
          <input
            type="number"
            step="0.1"
            value={tokenAmount}
            onChange={(e) => setTokenAmount(e.target.value)}
            placeholder="输入要mint的代币数量"
            disabled={!isTokenOwner}
          />
        </div>

        <button
          onClick={handleMintTokens}
          disabled={isPending || isConfirming || !tokenAmount || !recipientAddress || !isTokenOwner}
          style={{ width: '100%' }}
        >
          {isPending || isConfirming ? 'Minting...' :
           !isTokenOwner ? '需要Owner权限' :
           `为 ${recipientAddress ? recipientAddress.slice(0, 6) + '...' + recipientAddress.slice(-4) : '地址'} Mint ${tokenAmount || '0'} 代币`}
        </button>

        {!isTokenOwner && (
          <p style={{ fontSize: '0.8rem', color: '#ff6b6b', marginTop: '0.5rem' }}>
            ⚠️ 只有合约owner可以mint代币
          </p>
        )}
      </div>




    </div>
  )
}

export default MintTokens
