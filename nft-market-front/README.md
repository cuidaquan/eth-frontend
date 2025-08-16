# NFT Market Frontend

这是一个基于 React + Vite + AppKit 的 NFT 市场前端应用，支持 NFT 上架与“回调购买”，并提供管理员发放测试代币功能。

## 功能特性

- 🔗 **钱包连接**: 使用 AppKit 支持多种钱包连接（包括 WalletConnect）
- 🎨 **NFT 上架**: 用户可以将自己的 NFT 上架到市场
- 🛒 **NFT 购买（回调模式）**: 使用 ERC20 代币直接向市场合约发起 transferWithCallback，市场在 tokensReceived 回调中完成结算与转移，无需授权
- 👥 **多账户支持**: 支持切换不同账户进行操作
- 📱 **响应式设计**: 适配桌面和移动端
- 🪙 **获取代币**: 管理员在“获取代币”页为任意地址发放测试代币

## 合约地址

- **NFTMarket**: `0x54924e9036f1Ac50be3b4A4a87813AeDDdd703B2`
- **ExtendedERC20**: `0x89865AAF2251b10ffc80CE4A809522506BF10bA2`
- **MyNFT**: `0x08DcAA6dE0Ca584b8C5d810B027afE23D31C4AF1`

## 安装和运行

### 1. 安装依赖

```bash
cd nft-market-front
npm install
```

### 2. 配置环境变量

项目已经配置了 WalletConnect Project ID。如果您需要使用自己的 Project ID：

1. 复制 `.env.example` 文件为 `.env.local`
2. 访问 [https://cloud.reown.com](https://cloud.reown.com) 创建新项目
3. 获取 Project ID
4. 在 `.env.local` 文件中更新 `VITE_WALLETCONNECT_PROJECT_ID`

```bash
# .env.local
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### 3. 启动开发服务器

```bash
npm run dev
```

应用将在 `http://localhost:3001` 启动。

## 使用说明

### 1. 环境配置

项目已经预配置了 WalletConnect Project ID，可以直接使用。如需自定义配置：

1. 复制 `.env.example` 为 `.env.local`
2. 在 `.env.local` 中配置您的 Project ID
3. 重启开发服务器

### 2. 连接钱包

- 点击"连接钱包"按钮
- 选择您的钱包（推荐使用支持 WalletConnect 的移动端钱包）
- 确保连接到 Sepolia 测试网

### 3. 上架 NFT

1. 切换到"上架 NFT"标签页
2. 如果您有 NFT，会显示在列表中
3. 点击"授权给市场"按钮，授权 NFT 给市场合约
4. 选择要上架的 NFT
5. 输入价格（以 ETH 为单位）
6. 点击"确认上架"，上架成功后将自动跳转至“市场”页

### 4. 购买 NFT（回调方式）

1. 在"市场"标签页查看所有上架的 NFT
2. 确保您有足够的 ERC20 代币余额
3. 直接点击"购买"按钮，即会发起 ERC20 的 transferWithCallback 到市场合约
4. 市场合约在 tokensReceived 回调中完成价格校验、手续费结算与 NFT 转移
5. 全流程无需进行 ERC20 授权
### 5. 切换账户

- 点击右上角的地址，选择"断开连接"
- 重新连接不同的钱包账户
- 不同账户可以进行不同的操作（上架/购买）

### 6. 测试流程

为了完整测试应用功能，建议按以下步骤操作：

1. **准备测试环境**：
   - 确保有两个不同的钱包账户
   - 账户 A 拥有一些 NFT
   - 账户 B 拥有一些 ERC20 代币（若无，可让管理员在“获取代币”页为其发放）

2. **使用账户 A 上架 NFT**：
   - 连接账户 A
   - 授权 NFT 给市场合约
   - 上架 NFT 并设置价格（成功后会自动跳转市场页）

3. **使用账户 B 购买 NFT（回调模式）**：
   - 断开账户 A，连接账户 B
   - 无需 ERC20 授权，直接点击购买
   - 等待交易确认，NFT 将从市场转移到买家地址

## 技术栈

- **React 18**: 前端框架
- **TypeScript**: 类型安全
- **Vite**: 构建工具
- **AppKit**: 钱包连接（WalletConnect）
- **Wagmi**: 以太坊 React Hooks
- **Viem**: 以太坊客户端库

## 开发说明

### 项目结构

```
src/
├── components/          # React 组件
│   ├── ListNFT.tsx     # NFT 上架组件
│   └── NFTMarketplace.tsx # NFT 市场组件
├── contracts/          # 合约 ABI 和地址
│   ├── NFTMarket.ts
│   ├── MyNFT.ts
│   └── ExtendedERC20.ts
├── config/             # 配置文件
│   └── wagmi.ts        # AppKit 和 Wagmi 配置
├── App.tsx             # 主应用组件
├── main.tsx            # 应用入口
└── index.css           # 样式文件
```

### 注意事项

1. **测试网络**: 确保使用 Sepolia 测试网
2. **测试代币**: 需要有测试 ETH 和 ERC20 代币（可在“获取代币”页由管理员发放）
3. **NFT 授权**: 上架前需要先授权 NFT 给市场合约
4. **购买方式**: 购买采用 ERC20 的 transferWithCallback 回调模式，无需 ERC20 授权

## 构建部署

```bash
npm run build
```

构建产物将生成在 `dist` 目录中。

## 故障排除

1. **钱包连接失败**: 检查网络是否为 Sepolia
2. **交易失败**: 检查余额和授权是否充足
3. **NFT 不显示**: 确保钱包地址拥有 NFT
4. **页面空白**: 检查 Project ID 是否正确配置
