import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { transferDAO } from '../database/dao';
import { transferIndexer } from '../indexer/indexer';
import { TransferQueryParams, TransferResponse, TransferData } from '../types';
import { config } from '../config';

// 地址验证
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// 格式化转账数据
function formatTransferData(transfer: any): TransferData {
  return {
    txHash: transfer.txHash || transfer.tx_hash,
    blockNumber: transfer.blockNumber || transfer.block_number,
    timestamp: transfer.timestamp.toISOString(),
    from: transfer.fromAddress || transfer.from_address,
    to: transfer.toAddress || transfer.to_address,
    valueRaw: transfer.valueRaw || transfer.value_raw,
    value: transfer.valueDecimal || transfer.value_decimal || '0',
    tokenContract: transfer.tokenContract || transfer.token_contract
  };
}

export async function registerRoutes(fastify: FastifyInstance) {
  // 健康检查
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      indexer: {
        running: transferIndexer.isIndexerRunning()
      }
    };
  });

  // 获取转账记录
  fastify.get('/api/transfers', {
    schema: {
      querystring: {
        type: 'object',
        required: ['address'],
        properties: {
          address: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
          direction: { type: 'string', enum: ['sent', 'received', 'all'] },
          limit: { type: 'integer', minimum: 1, maximum: 200 },
          cursor: { type: 'string' }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const query = request.query as any;
    
    const params: TransferQueryParams = {
      address: query.address.toLowerCase(),
      direction: query.direction || 'all',
      limit: Math.min(parseInt(query.limit) || 50, 200),
      cursor: query.cursor
    };

    try {
      const { transfers, nextCursor } = await transferDAO.getTransfers(params);

      const response: TransferResponse = {
        data: transfers.map(formatTransferData),
        nextCursor
      };

      return response;
    } catch (error) {
      console.error('查询转账记录失败:', error);
      reply.status(500).send({
        error: 'Internal Server Error',
        message: '查询转账记录失败'
      });
    }
  });

  // 管理接口：重新索引（需要API密钥）
  fastify.post('/admin/reindex', {
    preHandler: async (request: FastifyRequest, reply: FastifyReply) => {
      const apiKey = request.headers['x-api-key'];
      if (!config.adminApiKey || apiKey !== config.adminApiKey) {
        reply.status(401).send({ error: 'Unauthorized' });
        return;
      }
    },
    schema: {
      body: {
        type: 'object',
        properties: {
          fromBlock: { type: 'integer', minimum: 0 }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    
    try {
      // 这里可以实现重新索引的逻辑
      // 暂时返回成功响应
      return {
        message: '重新索引请求已接收',
        fromBlock: body.fromBlock || 0
      };
    } catch (error) {
      console.error('重新索引失败:', error);
      reply.status(500).send({
        error: 'Internal Server Error',
        message: '重新索引失败'
      });
    }
  });

  // 获取索引状态
  fastify.get('/api/status', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { indexStateDAO } = await import('../database/dao');
      const { db } = await import('../database/connection');
      const indexState = await indexStateDAO.getIndexState(config.tokenAddress);

      // 获取总转账记录数
      const memDb = db as any;
      const totalTransfers = memDb.getTransfersCount();

      return {
        tokenContract: config.tokenAddress,
        lastIndexedBlock: indexState?.lastIndexedBlock || 0,
        lastUpdated: indexState?.updatedAt || null,
        indexerRunning: transferIndexer.isIndexerRunning(),
        totalTransfers
      };
    } catch (error) {
      console.error('获取索引状态失败:', error);
      reply.status(500).send({
        error: 'Internal Server Error',
        message: '获取索引状态失败'
      });
    }
  });

  // 调试接口：获取所有转账记录（仅用于开发）
  fastify.get('/api/debug/transfers', async (_request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { db } = await import('../database/connection');
      const memDb = db as any;

      // 获取所有转账记录
      const allTransfers = memDb.getAllTransfers().slice(0, 10); // 只返回前10条

      return {
        total: memDb.getTransfersCount(),
        sample: allTransfers.map((transfer: any) => ({
          from: transfer.fromAddress,
          to: transfer.toAddress,
          value: transfer.valueDecimal,
          txHash: transfer.txHash.slice(0, 10) + '...',
          blockNumber: transfer.blockNumber
        }))
      };
    } catch (error) {
      console.error('获取调试信息失败:', error);
      reply.status(500).send({
        error: 'Internal Server Error',
        message: '获取调试信息失败'
      });
    }
  });
}
