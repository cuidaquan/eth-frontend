import React, { useState, useEffect } from 'react'
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, useReadContracts } from 'wagmi'
import { formatEther, encodeAbiParameters } from 'viem'
import { NFTMarketABI, NFT_MARKET_ADDRESS } from '../contracts/NFTMarket'
import { ExtendedERC20ABI, EXTENDED_ERC20_ADDRESS } from '../contracts/ExtendedERC20'
import { MyNFTABI, MY_NFT_ADDRESS } from '../contracts/MyNFT'
import {
  ListingWithMetadata as Listing,
  createListingTokenURIContracts,
  batchUpdateNFTMetadata,
  getDefaultNFTName,
  handleImageError
} from '../utils/nftUtils'

const NFTMarketplace: React.FC = () => {
  const { address } = useAccount()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tokenBalance, setTokenBalance] = useState<bigint>(0n)



  const { writeContract, data: hash, isPending } = useWriteContract()
  
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // 获取当前最大的 listing ID
  const { data: currentListingId } = useReadContract({
    address: NFT_MARKET_ADDRESS,
    abi: NFTMarketABI,
    functionName: 'getCurrentListingId',
  })

  // 获取用户的代币余额
  const { data: balance } = useReadContract({
    address: EXTENDED_ERC20_ADDRESS,
    abi: ExtendedERC20ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })



  // 创建批量读取合约的配置 - 直接调用public的listings映射
  const listingContracts = currentListingId && currentListingId > 0n
    ? Array.from({ length: Number(currentListingId) }, (_, i) => ({
        address: NFT_MARKET_ADDRESS,
        abi: NFTMarketABI,
        functionName: 'listings', // 直接调用public映射
        args: [BigInt(i + 1)],
      }))
    : []

  // 批量获取所有 listing 数据
  const { data: listingsData, isLoading: listingsLoading } = useReadContracts({
    contracts: listingContracts,
  })

  // 创建批量读取tokenURI的配置（基于已获取的listing数据）
  const tokenURIContracts = createListingTokenURIContracts(listingsData, listingsLoading, MY_NFT_ADDRESS, MyNFTABI)

  // 批量获取所有tokenURI
  const { data: tokenURIsData, isLoading: tokenURIsLoading } = useReadContracts({
    contracts: tokenURIContracts,
  })

  // 处理获取到的 listing 数据和 tokenURI 数据
  useEffect(() => {
    if (!listingsData || listingsLoading) {
      setLoading(listingsLoading)
      return
    }

    if (tokenURIsLoading) {
      setLoading(true)
      return
    }

    const initializeListings = async () => {
      setLoading(true)
      try {
        const activeListings: Listing[] = []
        let tokenURIIndex = 0

        listingsData.forEach((result, index) => {
          if (result.status === 'success' && result.result) {
            try {
              // 根据合约返回的结构解析数据
              const listingData = result.result as any

              // 如果是数组格式 [seller, nftContract, tokenId, price, active]
              if (Array.isArray(listingData) && listingData.length >= 5) {
                const [seller, nftContract, tokenId, price, active] = listingData

                // 只添加活跃的 listing
                if (active) {
                  tokenURIIndex++

                  activeListings.push({
                    listingId: BigInt(index + 1),
                    seller: seller as string,
                    nftContract: nftContract as string,
                    tokenId: tokenId as bigint,
                    price: price as bigint,
                    active: active as boolean,
                    imageLoading: true
                  })
                }
              }
              // 如果是对象格式
              else if (listingData && typeof listingData === 'object') {
                const { seller, nftContract, tokenId, price, active } = listingData

                if (active) {
                  tokenURIIndex++

                  activeListings.push({
                    listingId: BigInt(index + 1),
                    seller,
                    nftContract,
                    tokenId,
                    price,
                    active,
                    imageLoading: true
                  })
                }
              }
            } catch (parseErr) {
              console.error(`解析 listing ${index + 1} 数据失败:`, parseErr)
            }
          }
        })

        setListings(activeListings)

        // 异步获取每个listing的NFT元数据
        await batchUpdateNFTMetadata(
          activeListings,
          tokenURIsData,
          setListings,
          (listing) => listing.tokenId,
          (listing) => listing.listingId
        )
      } catch (err) {
        console.error('处理市场数据失败:', err)
        setError('处理市场数据失败')
      } finally {
        setLoading(false)
      }
    }

    initializeListings()
  }, [listingsData, listingsLoading, tokenURIsData, tokenURIsLoading])

  // 更新代币余额
  useEffect(() => {
    if (balance) {
      setTokenBalance(balance)
    }
  }, [balance])



  // 购买 NFT
  const handleBuyNFT = async (listingId: bigint, price: bigint) => {
    if (!address) return

    // 检查余额
    if (tokenBalance < price) {
      setError('代币余额不足')
      return
    }

    try {
      setError('')
      setSuccess('')

      // 将 listingId 编码为 bytes 传给回调（使用 viem 原生编码）
      const data = encodeAbiParameters([{ type: 'uint256' }], [listingId])

      writeContract({
        address: EXTENDED_ERC20_ADDRESS,
        abi: ExtendedERC20ABI,
        functionName: 'transferWithCallback',
        args: [NFT_MARKET_ADDRESS as `0x${string}`, price, data],
      })
    } catch (err: any) {
      setError(`购买失败: ${err.message}`)
    }
  }

  // 监听交易确认
  useEffect(() => {
    if (isConfirmed) {
      setSuccess('购买成功！')
      // 重新获取市场数据
      window.location.reload()
    }
  }, [isConfirmed])

  if (loading) {
    return <div className="loading">加载市场数据中...</div>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>NFT 市场</h2>
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      {listings.length === 0 ? (
        <div className="card">
          <p>市场上暂无 NFT 出售</p>
        </div>
      ) : (
        <div className="grid">
          {listings.map((listing) => (
            <div key={listing.listingId.toString()} className="nft-card">
              <div className="nft-image" style={{
                background: listing.image ? 'transparent' : `linear-gradient(45deg, #${listing.tokenId.toString(16).padStart(6, '0')}, #${(Number(listing.tokenId) * 123456).toString(16).slice(-6)})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {listing.imageLoading ? (
                  <div style={{ color: '#999' }}>加载中...</div>
                ) : listing.image ? (
                  <img
                    src={listing.image}
                    alt={listing.name || `NFT #${listing.tokenId.toString()}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => handleImageError(e, listing.tokenId)}
                  />
                ) : (
                  getDefaultNFTName(listing.tokenId)
                )}
              </div>
              <div style={{ padding: '1rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>
                  {listing.name || getDefaultNFTName(listing.tokenId)}
                </h3>
                {listing.description && (
                  <p style={{
                    margin: '0 0 1rem 0',
                    fontSize: '0.9rem',
                    color: '#ccc',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {listing.description}
                  </p>
                )}
                <p style={{ margin: '0.5rem 0' }}><strong>价格:</strong> {formatEther(listing.price)} TOKEN</p>
                <p style={{ margin: '0.5rem 0' }}><strong>卖家:</strong> {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}</p>

                <div style={{ marginTop: '1rem' }}>
                  {listing.seller.toLowerCase() === address?.toLowerCase() ? (
                    <button disabled style={{ width: '100%' }}>
                      这是您的 NFT
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuyNFT(listing.listingId, listing.price)}
                      disabled={isPending || isConfirming || tokenBalance < listing.price}
                      style={{ width: '100%' }}
                    >
                      {isPending || isConfirming ? '购买中...' :
                       tokenBalance < listing.price ? '余额不足' : '购买'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default NFTMarketplace
