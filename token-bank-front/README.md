# TokenBank Frontend

一个现代化的 TokenBank DApp 前端应用，集成了 ERC20 转账索引器，提供完整的代币银行服务体验。

## 功能特性

- 🔗 连接 MetaMask 钱包
- 🪙 Mint 测试代币（仅合约拥有者可用）
- 💰 显示用户 Token 余额和银行存款余额
- 💸 存款功能（使用 transferWithCallback）
- 💳 取款功能
- 📊 **转账记录查询**（通过后端API）
- 🔍 支持发送/接收/全部转账筛选
- 📄 分页加载转账历史
- 📱 响应式设计
- ⚡ 减少 RPC 调用，提高性能

## 技术栈

- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Viem** - 以太坊交互库（纯 Viem，无 Wagmi 依赖）
- **Vite** - 构建工具
- **REST API** - 后端转账数据集成

## 系统架构

```
前端 (React + Viem) ←→ 后端索引器 (Node.js + Fastify) ←→ 区块链 (Sepolia)
     ↓                           ↓                              ↓
钱包交互/合约调用          转账记录API服务                  ERC20事件监听
```

## 合约地址

- **ExtendedERC20**: `0x89865AAF2251b10ffc80CE4A809522506BF10bA2`
- **TokenBank**: `0x376900F896C238361A0Ed638292Da27E3BF10B11`
- **Permit2**: `0x000000000022D473030F116dDEE9F6B43aC78BA3`
- **网络**: Sepolia 测试网

## 快速开始

### 环境要求

- Node.js 18+
- MetaMask 浏览器扩展
- Infura 账户（用于 Sepolia 测试网）
- 运行中的后端索引器服务

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件并配置：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件：

```env
# Infura API Key (用于钱包连接和合约交互)
VITE_INFURA_KEY=your_infura_project_id_here

# 后端API地址 (ERC20转账索引器服务)
VITE_BACKEND_URL=http://localhost:3002
```

### 3. 启动后端服务

确保后端索引器服务正在运行：

```bash
# 在 erc20-transfer-indexer 目录中
cd ../erc20-transfer-indexer
npm run dev
```

后端服务将在 `http://localhost:3002` 启动。

### 4. 启动前端服务

```bash
npm run dev
```

前端应用将在 `http://localhost:3000` 启动。

### 5. 构建生产版本

```bash
npm run build
```

## 使用说明

### 1. 连接 MetaMask
- 确保已安装 MetaMask 浏览器扩展
- 点击"连接 MetaMask"按钮
- MetaMask 会弹出账户选择器，选择要连接的账户
- 应用会自动切换到 Sepolia 测试网（如果需要）
- 确保钱包中有一些 Sepolia ETH 用于支付 gas 费

### 2. 获取测试代币
- 如果你是合约拥有者，可以使用 "Mint 代币" 功能铸造代币
- 普通用户需要联系合约部署者获取代币
- 或者从其他用户那里获得代币

### 3. Mint 代币流程（仅合约拥有者）
1. 在"接收者地址"输入框中输入要接收代币的地址
   - 可以点击"我的"按钮快速填入自己的地址
2. 在"Mint 数量"输入框中输入要铸造的数量
3. 点击"Mint 代币"按钮
4. 确认交易并等待区块确认
5. 如果你不是合约拥有者，会收到权限错误提示

### 4. 存款流程
1. 在"存款"部分输入要存款的金额
2. 点击"存款"按钮
3. 确认交易并等待区块确认
4. 代币会通过 transferWithCallback 直接转入银行并记录余额

### 5. 取款流程
1. 在"取款"部分输入要取款的金额
2. 点击"取款"按钮
3. 确认交易并等待区块确认

### 6. 查看转账记录 🆕
1. 连接钱包后，转账记录会自动加载
2. 支持三种筛选模式：
   - **全部**：显示所有相关转账
   - **发送**：仅显示发出的转账
   - **接收**：仅显示接收的转账
3. 支持分页加载，点击"加载更多"查看历史记录
4. 转账记录通过后端API获取，响应速度快
5. 显示详细信息：交易哈希、对方地址、金额、时间等

## 项目结构

```
src/
├── components/
│   └── Transfers.tsx  # 转账记录组件 🆕
├── contracts/
│   ├── config.ts      # 合约地址配置
│   └── abis.ts        # 合约 ABI
├── hooks/
│   ├── useWallet.ts   # 钱包连接 Hook
│   ├── useTokenBank.ts # TokenBank 合约交互 Hook
│   └── useTransfers.ts # 转账记录 Hook 🆕
├── types/
│   └── index.ts       # TypeScript 类型定义 🆕
├── App.tsx            # 主应用组件
├── main.tsx           # 应用入口
└── index.css          # 样式文件
```

## 核心功能

### 1. 钱包连接和合约交互
- 使用 Viem 直接与区块链交互
- 支持 MetaMask 钱包连接
- 实时余额查询和交易执行

### 2. 转账记录查询 🆕
- 通过后端API获取转账历史
- 支持地址筛选和分页
- 减少前端RPC调用，提高性能
- 实时数据更新

### 3. 用户体验优化
- 响应式设计，支持移动端
- 友好的错误提示和加载状态
- 交易状态实时反馈

## 注意事项

1. **网络配置**: 确保钱包连接到 Sepolia 测试网
2. **Gas 费用**: 每次交易都需要支付 Sepolia ETH 作为 gas 费
3. **授权机制**: 存款前需要先授权 TokenBank 合约使用你的代币
4. **交易确认**: 所有交易都需要等待区块确认才能看到余额更新
5. **后端依赖**: 转账记录功能需要后端索引器服务正常运行
6. **RPC限制**: 前端已优化RPC调用，主要数据通过后端API获取

## 故障排除

### 常见问题

1. **连接失败**
   - 确保安装了 MetaMask 浏览器扩展
   - 检查网络是否为 Sepolia 测试网
   - 确认 Infura API Key 配置正确

2. **交易失败**
   - 检查钱包中是否有足够的 ETH 支付 gas 费
   - 确保输入的金额不超过可用余额
   - 检查合约地址是否正确

3. **余额不更新**
   - 等待交易确认（通常需要几个区块）
   - 刷新页面重新加载数据
   - 检查网络连接

4. **授权问题**
   - 如果存款失败，可能需要先进行授权
   - 授权额度不足时会自动显示授权按钮

5. **转账记录不显示** 🆕
   - 确保后端索引器服务正在运行 (`http://localhost:3002`)
   - 检查 `.env.local` 中的 `VITE_BACKEND_URL` 配置
   - 查看浏览器控制台是否有网络错误
   - 确认钱包地址有相关的转账记录

6. **RPC限流错误 (429)** 🆕
   - 前端已优化，主要通过后端API获取数据
   - 如仍出现，可升级 Infura 计划或更换 RPC 提供商

### 调试技巧

1. **检查后端服务状态**：
   ```bash
   curl http://localhost:3002/health
   ```

2. **查看转账记录API**：
   ```bash
   curl "http://localhost:3002/api/transfers?address=YOUR_ADDRESS&limit=5"
   ```

3. **查看浏览器控制台**：
   - 打开开发者工具 (F12)
   - 查看 Console 和 Network 标签页
   - 检查是否有错误信息

## 开发和扩展

### 开发命令

```bash
# 开发模式
npm run dev

# 类型检查
npm run type-check

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

### 扩展功能

1. **修改合约地址**：更新 `src/contracts/config.ts`
2. **添加新的合约交互**：在 `src/hooks/useTokenBank.ts` 中添加新函数
3. **修改UI样式**：编辑 `src/index.css`
4. **添加新的合约ABI**：更新 `src/contracts/abis.ts`
5. **扩展转账记录功能**：修改 `src/components/Transfers.tsx`

### 与后端集成

前端通过以下方式与后端通信：

```typescript
// 获取转账记录
const response = await fetch(`${BACKEND_URL}/api/transfers`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
});
```

## 部署

### 生产环境配置

```env
# 生产环境 .env.local
VITE_INFURA_KEY=your_production_infura_key
VITE_BACKEND_URL=https://your-backend-domain.com
```

### 构建和部署

```bash
# 构建
npm run build

# 部署到静态托管服务
# 将 dist/ 目录上传到 Vercel、Netlify 等服务
```

## 许可证

MIT License
