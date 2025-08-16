/**
 * NFT工具函数 - 提取公共的NFT元数据获取和处理逻辑
 */

// NFT元数据接口
export interface NFTMetadata {
  name?: string
  description?: string
  image?: string
}

// 扩展的NFT接口（用于ListNFT组件）
export interface NFTWithMetadata {
  tokenId: bigint
  tokenURI: string
  isApproved: boolean
  name?: string
  description?: string
  image?: string
  imageLoading?: boolean
}

// 扩展的Listing接口（用于NFTMarketplace组件）
export interface ListingWithMetadata {
  listingId: bigint
  seller: string
  nftContract: string
  tokenId: bigint
  price: bigint
  active: boolean
  name?: string
  description?: string
  image?: string
  imageLoading?: boolean
}

/**
 * 获取NFT元数据的函数
 * @param tokenURI - NFT的tokenURI
 * @returns Promise<NFTMetadata> - 解析后的元数据
 */
export const fetchNFTMetadata = async (tokenURI: string): Promise<NFTMetadata> => {
  try {
    // 处理IPFS URL
    let metadataUrl = tokenURI
    if (tokenURI.startsWith('ipfs://')) {
      metadataUrl = `https://ipfs.io/ipfs/${tokenURI.slice(7)}`
    }
    
    const response = await fetch(metadataUrl)
    if (!response.ok) {
      throw new Error('Failed to fetch metadata')
    }
    
    const metadata = await response.json()
    
    // 处理图片URL
    let imageUrl = metadata.image
    if (imageUrl && imageUrl.startsWith('ipfs://')) {
      imageUrl = `https://ipfs.io/ipfs/${imageUrl.slice(7)}`
    }
    
    return {
      name: metadata.name,
      description: metadata.description,
      image: imageUrl
    }
  } catch (error) {
    console.error('Error fetching NFT metadata:', error)
    return {}
  }
}

/**
 * 处理tokenURI数据，提取有效的URI字符串
 * @param tokenURIsData - useReadContracts返回的数据
 * @param index - 数据索引
 * @param defaultTokenId - 默认的tokenId（用于生成默认URI）
 * @returns string - 处理后的tokenURI
 */
export const processTokenURI = (
  tokenURIsData: any[] | undefined,
  index: number,
  defaultTokenId: bigint
): string => {
  const defaultURI = `My NFT #${defaultTokenId.toString()}`
  
  if (!tokenURIsData || !tokenURIsData[index]) {
    return defaultURI
  }
  
  const result = tokenURIsData[index]
  if (result.status === 'success' && typeof result.result === 'string' && result.result) {
    return result.result
  }
  
  return defaultURI
}

/**
 * 批量更新NFT元数据
 * @param items - NFT或Listing数组
 * @param tokenURIsData - tokenURI数据
 * @param updateCallback - 更新状态的回调函数
 * @param getTokenId - 获取tokenId的函数
 * @param getItemId - 获取唯一标识的函数
 */
export const batchUpdateNFTMetadata = async <T extends { imageLoading?: boolean }>(
  items: T[],
  tokenURIsData: any[] | undefined,
  updateCallback: (updater: (prev: T[]) => T[]) => void,
  getTokenId: (item: T) => bigint,
  getItemId: (item: T) => string | bigint
) => {
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const tokenId = getTokenId(item)
    const itemId = getItemId(item)
    
    try {
      // 获取对应的tokenURI
      const tokenURI = processTokenURI(tokenURIsData, i, tokenId)
      
      // 获取元数据（只有当tokenURI是有效URL时才尝试）
      let metadata: NFTMetadata = {}
      if (tokenURI.startsWith('http') || tokenURI.startsWith('ipfs://')) {
        metadata = await fetchNFTMetadata(tokenURI)
      }
      
      // 更新对应的item信息
      updateCallback(prev => prev.map(prevItem => {
        const prevItemId = getItemId(prevItem)
        return prevItemId === itemId
          ? {
              ...prevItem,
              name: metadata.name || `NFT #${tokenId.toString()}`,
              description: metadata.description,
              image: metadata.image,
              imageLoading: false
            } as T
          : prevItem
      }))
    } catch (err) {
      console.error(`获取 NFT ${tokenId} 元数据失败:`, err)
      // 更新失败状态
      updateCallback(prev => prev.map(prevItem => {
        const prevItemId = getItemId(prevItem)
        return prevItemId === itemId
          ? { ...prevItem, imageLoading: false } as T
          : prevItem
      }))
    }
  }
}

/**
 * 创建tokenURI批量获取配置（用于ListNFT组件）
 * @param tokenIds - NFT tokenId数组
 * @param contractAddress - NFT合约地址
 * @param abi - 合约ABI
 * @returns 批量调用配置数组
 */
export const createTokenURIContracts = (
  tokenIds: readonly bigint[] | undefined,
  contractAddress: `0x${string}`,
  abi: any
) => {
  if (!tokenIds || tokenIds.length === 0) {
    return []
  }
  
  return tokenIds.map(tokenId => ({
    address: contractAddress,
    abi,
    functionName: 'tokenURI',
    args: [tokenId],
  }))
}

/**
 * 创建市场listing的tokenURI批量获取配置
 * @param listingsData - 市场listing数据
 * @param listingsLoading - 是否正在加载
 * @param nftContractAddress - NFT合约地址
 * @param abi - NFT合约ABI
 * @returns 批量调用配置数组
 */
export const createListingTokenURIContracts = (
  listingsData: any[] | undefined,
  listingsLoading: boolean,
  nftContractAddress: `0x${string}`,
  abi: any
) => {
  if (!listingsData || listingsLoading) {
    return []
  }

  return listingsData
    .map((result, index) => {
      if (result.status === 'success' && result.result) {
        try {
          const listingData = result.result as any
          if (Array.isArray(listingData) && listingData.length >= 5) {
            const [, , tokenId, , active] = listingData
            if (active) {
              return {
                address: nftContractAddress,
                abi,
                functionName: 'tokenURI',
                args: [tokenId as bigint],
              }
            }
          }
        } catch (err) {
          console.error(`解析 listing ${index + 1} 失败:`, err)
        }
      }
      return null
    })
    .filter(Boolean) as any[]
}

/**
 * 检查tokenURI是否为有效的URL
 * @param tokenURI - 要检查的tokenURI
 * @returns boolean - 是否为有效URL
 */
export const isValidTokenURI = (tokenURI: string): boolean => {
  return tokenURI.startsWith('http') || tokenURI.startsWith('ipfs://')
}

/**
 * 生成默认的NFT名称
 * @param tokenId - NFT的tokenId
 * @returns string - 默认名称
 */
export const getDefaultNFTName = (tokenId: bigint): string => {
  return `NFT #${tokenId.toString()}`
}

/**
 * 处理图片加载错误的通用函数
 * @param event - 图片错误事件
 * @param tokenId - NFT的tokenId
 */
export const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>, tokenId: bigint) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
  const parent = target.parentElement
  if (parent) {
    parent.style.background = `linear-gradient(45deg, #${tokenId.toString(16).padStart(6, '0')}, #${(Number(tokenId) * 123456).toString(16).slice(-6)})`
    parent.innerHTML = getDefaultNFTName(tokenId)
  }
}
