import { startServer } from './server';
import { transferIndexer } from './indexer/indexer';
import { db } from './database/connection';
import { config } from './config';

async function main() {
  console.log('启动 ERC20 转账索引器...');
  console.log('配置信息:');
  console.log(`- Token 合约: ${config.tokenAddress}`);
  console.log(`- RPC URL: ${config.rpcUrl}`);
  console.log(`- 服务端口: ${config.port}`);
  console.log(`- 最小确认数: ${config.minConfirmations}`);
  console.log(`- 步长: ${config.stepBlocks}`);

  try {
    // 测试数据库连接
    console.log('测试数据库连接...');
    const connected = await db.testConnection();
    if (!connected) {
      throw new Error('数据库连接失败');
    }

    // 启动HTTP服务器
    console.log('启动HTTP服务器...');
    const server = await startServer();

    // 启动索引器
    console.log('启动事件索引器...');
    transferIndexer.start().catch(error => {
      console.error('索引器启动失败:', error);
    });

    // 优雅关闭处理
    const gracefulShutdown = async (signal: string) => {
      console.log(`收到 ${signal} 信号，开始优雅关闭...`);
      
      try {
        // 停止索引器
        await transferIndexer.stop();
        
        // 关闭HTTP服务器
        await server.close();
        
        // 关闭数据库连接
        await db.close();
        
        console.log('应用已优雅关闭');
        process.exit(0);
      } catch (error) {
        console.error('关闭过程中出错:', error);
        process.exit(1);
      }
    };

    // 监听关闭信号
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    console.log('ERC20 转账索引器启动完成！');

  } catch (error) {
    console.error('启动失败:', error);
    process.exit(1);
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 启动应用
main();
