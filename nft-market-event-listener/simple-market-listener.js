/**
 * 简化版 NFTMarket 事件监听器
 * 专注于监听上架和买卖事件
 */

import { createPublicClient, http, parseAbiItem, formatEther } from 'viem'
import { sepolia } from 'viem/chains'
import { config } from 'dotenv'

// 加载环境变量
config()

// 配置
const NFT_MARKET_ADDRESS = process.env.NFT_MARKET_ADDRESS
const RPC_URL = process.env.RPC_URL

// 验证配置
if (!NFT_MARKET_ADDRESS) {
  console.error('❌ 错误: 未设置 NFT_MARKET_ADDRESS')
  process.exit(1)
}

if (!RPC_URL) {
  console.error('❌ 错误: 请在 .env 文件中设置有效的 RPC_URL')
  console.error('💡 提示: 复制 .env.example 为 .env 并设置你的 Infura/Alchemy API Key')
  process.exit(1)
}

// 创建客户端
const client = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL)
})

// 事件定义
const events = {
  NFTListed: parseAbiItem('event NFTListed(uint256 indexed listingId, address indexed seller, address indexed nftContract, uint256 tokenId, uint256 price)'),
  NFTSold: parseAbiItem('event NFTSold(uint256 indexed listingId, address indexed buyer, address indexed seller, address nftContract, uint256 tokenId, uint256 price)')
}

// 工具函数
const formatTime = (timestamp) => new Date(Number(timestamp) * 1000).toLocaleString('zh-CN')

// 监听上架事件
function watchListedEvents() {
  return client.watchEvent({
    address: NFT_MARKET_ADDRESS,
    event: events.NFTListed,
    onLogs: async (logs) => {
      for (const log of logs) {
        try {
          const block = await client.getBlock({ blockNumber: log.blockNumber })
          
          console.log('\n🆕 NFT 上架')
          console.log('─'.repeat(80))
          console.log(`⏰ 时间: ${formatTime(block.timestamp)}`)
          console.log(`🆔 上架ID: ${log.args.listingId}`)
          console.log(`👤 卖家: ${log.args.seller}`)
          console.log(`🎯 Token ID: ${log.args.tokenId}`)
          console.log(`💰 价格: ${formatEther(log.args.price)} ether`)
          console.log(`📝 交易: ${log.transactionHash}`)
          console.log('─'.repeat(80))
        } catch (error) {
          console.error('处理上架事件失败:', error)
        }
      }
    }
  })
}

// 监听购买事件
function watchSoldEvents() {
  return client.watchEvent({
    address: NFT_MARKET_ADDRESS,
    event: events.NFTSold,
    onLogs: async (logs) => {
      for (const log of logs) {
        try {
          const block = await client.getBlock({ blockNumber: log.blockNumber })
          
          console.log('\n💰 NFT 成交')
          console.log('─'.repeat(80))
          console.log(`⏰ 时间: ${formatTime(block.timestamp)}`)
          console.log(`🆔 上架ID: ${log.args.listingId}`)
          console.log(`🛒 买家: ${log.args.buyer}`)
          console.log(`👤 卖家: ${log.args.seller}`)
          console.log(`🎯 Token ID: ${log.args.tokenId}`)
          console.log(`💰 成交价: ${formatEther(log.args.price)} ether`)
          console.log(`📝 交易: ${log.transactionHash}`)
          console.log('─'.repeat(80))
        } catch (error) {
          console.error('处理购买事件失败:', error)
        }
      }
    }
  })
}

// 主函数
async function main() {
  console.log('🚀 NFTMarket 买卖监听器')
  console.log(`📍 合约: ${NFT_MARKET_ADDRESS}`)
  console.log(`🌐 网络: Sepolia`)
  console.log('═'.repeat(80))
  
  try {
    // 测试连接
    const blockNumber = await client.getBlockNumber()
    console.log(`✅ 连接成功，当前区块: ${blockNumber}`)
    
    // 启动监听
    const unwatchListed = watchListedEvents()
    const unwatchSold = watchSoldEvents()
    
    console.log('👂 开始监听事件...')
    console.log('💡 按 Ctrl+C 退出\n')
    
    // 优雅退出
    process.on('SIGINT', () => {
      console.log('\n🛑 停止监听...')
      unwatchListed()
      unwatchSold()
      console.log('✅ 已停止')
      process.exit(0)
    })
    
    // 保持运行
    process.stdin.resume()
    
  } catch (error) {
    console.error('❌ 启动失败:', error.message)
    process.exit(1)
  }
}

main()
