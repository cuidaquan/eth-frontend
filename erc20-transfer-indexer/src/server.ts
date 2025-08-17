import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { registerRoutes } from './api/routes';
import { config } from './config';

export async function createServer() {
  const fastify = Fastify({
    logger: true
  });

  // 注册CORS插件
  await fastify.register(cors, {
    origin: true, // 开发环境允许所有来源，生产环境应该限制
    credentials: true
  });

  // 注册速率限制插件
  await fastify.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.timeWindow
  });

  // 注册路由
  await registerRoutes(fastify);

  // 错误处理
  fastify.setErrorHandler((error, _request, reply) => {
    fastify.log.error(error);
    
    if (error.validation) {
      reply.status(400).send({
        error: 'Bad Request',
        message: '请求参数验证失败',
        details: error.validation
      });
      return;
    }

    if (error.statusCode) {
      reply.status(error.statusCode).send({
        error: error.name,
        message: error.message
      });
      return;
    }

    reply.status(500).send({
      error: 'Internal Server Error',
      message: '服务器内部错误'
    });
  });

  // 404处理
  fastify.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({
      error: 'Not Found',
      message: '请求的资源不存在'
    });
  });

  return fastify;
}

export async function startServer() {
  const server = await createServer();
  
  try {
    await server.listen({ 
      port: config.port, 
      host: '0.0.0.0' 
    });
    console.log(`服务器启动成功，监听端口 ${config.port}`);
    return server;
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}
