# ERC20 Transfer Indexer

一个高性能的 ERC20 代币转账事件索引器，用于实时监控和存储以太坊 Sepolia 测试网上的代币转账记录。

## 功能特性

- 🔄 实时索引 ERC20 Transfer 事件
- 📊 RESTful API 接口
- 🗄️ 内存数据库存储（演示模式）/ PostgreSQL 数据库存储
- 🔍 支持地址筛选和分页查询
- ⚡ 高性能批量处理
- 🛡️ 错误处理和重试机制
- 📈 索引状态监控
- 🚀 支持 Sepolia 测试网

## 技术栈

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Web Framework**: Fastify
- **Database**: 内存数据库（演示）/ PostgreSQL（生产）
- **Blockchain**: viem (Ethereum client)
- **Network**: Sepolia Testnet

## 快速开始

### 环境要求

- Node.js 18+
- Infura 账户（用于 Sepolia 测试网）

### 安装依赖

```bash
npm install
```

### 环境配置

复制环境变量模板并配置：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件：

```env
# RPC Configuration
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# Token Contract (示例：测试代币地址)
TOKEN_ADDRESS=0x89865AAF2251b10ffc80CE4A809522506BF10bA2

# Indexing Configuration
START_BLOCK=8950000
MIN_CONFIRMATIONS=5
STEP_BLOCKS=1000
IDLE_INTERVAL_MS=10000

# Server Configuration
PORT=3002

# Optional: 生产环境数据库配置
# DATABASE_URL=postgresql://postgres:password@localhost:5432/erc20_indexer
```

### 启动服务

开发环境（使用内存数据库）：

```bash
npm run dev
```

生产环境（需要配置 PostgreSQL）：

```bash
npm run build
npm start
```

## API 接口

### 健康检查

```http
GET /health
```

响应：
```json
{
  "status": "ok",
  "timestamp": "2025-08-17T13:00:00.000Z",
  "indexer": {
    "running": true
  }
}
```

### 获取转账记录

```http
GET /api/transfers?address=0x...&direction=all&limit=50&cursor=123
```

参数：
- `address` (必需): 钱包地址（40字符十六进制）
- `direction` (可选): `sent` | `received` | `all` (默认: `all`)
- `limit` (可选): 每页数量，1-200 (默认: 50)
- `cursor` (可选): 分页游标

响应：
```json
{
  "data": [
    {
      "txHash": "0x166caed084f910f79e5777d8def9001cd244d1344fd9804ede129d2d08d5418c",
      "blockNumber": 8954559,
      "timestamp": "2025-08-10T14:35:36.000Z",
      "from": "0x3dd6ba106b13cb6538a9ed9fe1a51e115f9ee664",
      "to": "0xb6534f6f81e4cce99223e55effe8a7a43778becc",
      "valueRaw": "99000000000000000000",
      "value": "99",
      "tokenContract": "0x89865AAF2251b10ffc80CE4A809522506BF10bA2"
    }
  ],
  "nextCursor": "34"
}
```

### 获取索引状态

```http
GET /api/status
```

响应：
```json
{
  "tokenContract": "0x89865AAF2251b10ffc80CE4A809522506BF10bA2",
  "lastIndexedBlock": 8955265,
  "lastUpdated": "2025-08-17T13:05:09.740Z",
  "indexerRunning": true,
  "totalTransfers": 28
}
```

### 调试接口（仅开发环境）

```http
GET /api/debug/transfers
```

响应：
```json
{
  "total": 28,
  "sample": [
    {
      "from": "0x3dd6ba106b13cb6538a9ed9fe1a51e115f9ee664",
      "to": "0xb6534f6f81e4cce99223e55effe8a7a43778becc",
      "value": "99",
      "txHash": "0x5e86064f...",
      "blockNumber": 8951270
    }
  ]
}
```

## 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `RPC_URL` | Sepolia 测试网 RPC 端点 | - | ✅ |
| `TOKEN_ADDRESS` | ERC20 代币合约地址 | - | ✅ |
| `START_BLOCK` | 开始索引的区块号 | 最新区块-1000 | ❌ |
| `MIN_CONFIRMATIONS` | 最小确认数 | 5 | ❌ |
| `STEP_BLOCKS` | 每次查询的区块范围 | 1000 | ❌ |
| `IDLE_INTERVAL_MS` | 空闲时的轮询间隔 | 10000 | ❌ |
| `PORT` | 服务端口 | 3002 | ❌ |
| `DATABASE_URL` | PostgreSQL 连接字符串（生产环境） | - | ❌ |

### 内存数据库模式

默认使用内存数据库进行演示，特点：
- ✅ 无需额外配置
- ✅ 快速启动
- ❌ 重启后数据丢失
- ❌ 不适合生产环境

### PostgreSQL 模式

配置 `DATABASE_URL` 后自动切换到 PostgreSQL：
- ✅ 数据持久化
- ✅ 适合生产环境
- ❌ 需要额外配置数据库

## 项目架构

```
src/
├── api/           # API 路由和处理器
│   └── routes.ts  # RESTful API 接口
├── config/        # 配置管理
│   └── index.ts   # 环境变量配置
├── database/      # 数据库连接和 DAO
│   ├── connection.ts  # 数据库连接（内存/PostgreSQL）
│   └── dao.ts     # 数据访问对象
├── indexer/       # 区块链事件索引器
│   └── indexer.ts # 主索引器逻辑
├── types/         # TypeScript 类型定义
│   └── index.ts   # 接口和类型定义
└── index.ts       # 应用入口
```

## 与前端集成

本索引器为 `token-bank-front` 前端项目提供 API 服务：

- **前端地址**: http://localhost:3000
- **后端地址**: http://localhost:3002
- **API 前缀**: `/api/`

前端通过以下方式调用：
```typescript
// 获取用户转账记录
const response = await fetch(`${BACKEND_URL}/api/transfers?address=${userAddress}&limit=50`);
const { data, nextCursor } = await response.json();
```

## 开发和调试

### 开发命令

```bash
# 开发模式（热重载）
npm run dev

# 构建生产版本
npm run build

# 启动生产版本
npm start

# 类型检查
npm run type-check
```

### 调试技巧

1. **查看索引进度**：
   ```bash
   curl http://localhost:3002/api/status
   ```

2. **查看转账记录样本**：
   ```bash
   curl http://localhost:3002/api/debug/transfers
   ```

3. **测试特定地址**：
   ```bash
   curl "http://localhost:3002/api/transfers?address=0x3dd6ba106b13cb6538a9ed9fe1a51e115f9ee664&limit=5"
   ```

## 故障排除

### 常见问题

1. **RPC 限流 (429 错误)**
   ```
   解决方案：
   - 减少 STEP_BLOCKS 值（如 500）
   - 增加 IDLE_INTERVAL_MS 值（如 15000）
   - 使用付费 Infura 计划
   ```

2. **端口被占用**
   ```bash
   # 查找占用进程
   netstat -ano | findstr :3002

   # 终止进程
   taskkill /F /PID <PID>
   ```

3. **没有找到转账记录**
   ```
   原因：
   - 代币合约地址可能没有转账活动
   - 查询的地址没有相关转账
   - 索引还在进行中

   解决方案：
   - 检查 /api/status 确认索引状态
   - 使用 /api/debug/transfers 查看所有记录
   ```

4. **索引速度慢**
   ```
   优化方案：
   - 增加 STEP_BLOCKS 值（注意 RPC 限制）
   - 使用更快的 RPC 服务
   - 调整 MIN_CONFIRMATIONS 值
   ```

## 生产部署

### Docker 部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3002
CMD ["npm", "start"]
```

### 环境变量配置

生产环境建议配置：
```env
NODE_ENV=production
RPC_URL=https://sepolia.infura.io/v3/YOUR_PRODUCTION_KEY
DATABASE_URL=postgresql://user:pass@host:5432/db
MIN_CONFIRMATIONS=12
STEP_BLOCKS=500
IDLE_INTERVAL_MS=15000
```

## 许可证

MIT License
