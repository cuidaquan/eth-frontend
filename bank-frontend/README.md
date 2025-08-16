# Bank DApp 前端

基于 React + TypeScript + Vite + Wagmi + Tailwind CSS 构建的去中心化银行应用前端。

## 功能特性

- 🔗 **钱包连接**: 支持 MetaMask 等以太坊钱包连接
- 📊 **Tab 页面结构**: 分页加载，减少 API 请求，提升性能
- 💰 **存款功能**: 向银行合约存入 ETH
- 📊 **余额显示**: 实时显示合约总余额和用户存款余额
- 🏆 **排行榜**: 显示存款金额前三名用户
- 📜 **交易历史**: 基于区块链事件显示存款/提取记录
- 👑 **管理员面板**: 管理员可提取资金和更换管理员
- 🔄 **实时更新**: 监听合约事件，自动刷新数据
- 💾 **智能缓存**: 30秒数据缓存，避免重复请求

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **Web3 库**: Wagmi v2 + Viem v2
- **UI 样式**: Tailwind CSS
- **钱包连接**: RainbowKit
- **状态管理**: TanStack Query (React Query)

## 环境要求

- Node.js >= 16
- npm 或 yarn
- MetaMask 或其他以太坊钱包

## 安装与运行

1. 安装依赖：
```bash
npm install
```

2. 配置环境变量：
复制 `.env.example` 为 `.env` 并配置：
```
VITE_BANK_ADDRESS=0xb5dAa05466c04dd1a06212aF041c4945fc4d270F
VITE_TARGET_CHAIN_ID=11155111
VITE_RPC_URL=https://sepolia.infura.io/v3/dca2a8416ac24058860426614449251d
```

3. 启动开发服务器：
```bash
# 方法1：使用 npm 脚本（如果配置正确）
npm run dev

# 方法2：直接使用 vite（推荐）
npx vite --host

# 方法3：全局安装 vite 后使用
npm install -g vite
vite --host
```

4. 构建生产版本：
```bash
npm run build
```

## 合约信息

- **网络**: Sepolia 测试网
- **合约地址**: `0xb5dAa05466c04dd1a06212aF041c4945fc4d270F`
- **区块浏览器**: [Sepolia Etherscan](https://sepolia.etherscan.io/address/0xb5dAa05466c04dd1a06212aF041c4945fc4d270F)

## 使用说明

### 页面结构
应用采用 Tab 页面结构，包含以下页面：
- **📊 概览**: 显示合约总余额和用户存款余额
- **💰 存款**: 存款表单和操作
- **🏆 排行榜**: 显示存款金额前三名用户
- **📜 交易历史**: 显示最近的存款/提取记录
- **👑 管理员**: 管理员专用功能面板

### 普通用户
1. 连接钱包（确保切换到 Sepolia 测试网）
2. 在"存款"页面中输入 ETH 金额
3. 点击"存款"按钮并确认交易
4. 在"概览"和"排行榜"页面查看余额更新

### 管理员
1. 使用管理员地址连接钱包
2. 在"管理员"页面中可以：
   - 提取指定金额的 ETH
   - 提取合约中的全部 ETH
   - 更换管理员地址（需二次确认）

## 项目结构

```
bank-frontend/
├── src/
│   ├── components/          # React 组件
│   │   ├── WalletConnect.tsx    # 钱包连接组件
│   │   ├── BalanceCard.tsx      # 余额显示组件
│   │   ├── DepositForm.tsx      # 存款表单组件
│   │   ├── Top3List.tsx         # 排行榜组件
│   │   ├── TransactionHistory.tsx # 交易历史组件
│   │   └── AdminPanel.tsx       # 管理员面板组件
│   ├── hooks/               # 自定义 Hooks
│   │   └── useBankContract.ts   # 合约交互 Hooks
│   ├── lib/                 # 工具库
│   │   └── contract.ts          # 合约配置和 ABI
│   ├── config/              # 配置文件
│   │   └── chains.ts            # 区块链网络配置
│   ├── types/               # TypeScript 类型定义
│   │   └── bank.ts              # 银行相关类型
│   ├── App.tsx              # 主应用组件
│   ├── main.tsx             # 应用入口
│   └── index.css            # 全局样式
├── public/                  # 静态资源
├── .env.example             # 环境变量示例
└── README.md                # 项目说明
```

## 开发说明

### 主要组件说明

- **WalletConnect**: 处理钱包连接、断开和网络切换
- **BalanceCard**: 显示合约总余额和用户存款余额
- **DepositForm**: 存款表单，包含金额输入和校验
- **Top3List**: 显示存款排行榜前三名
- **TransactionHistory**: 显示最近的存款/提取交易记录
- **AdminPanel**: 管理员专用面板，提供资金管理功能

### 合约交互

使用 Wagmi 和 Viem 进行合约交互：
- `useReadContract`: 读取合约状态
- `useWriteContract`: 执行合约写入操作
- `useWatchContractEvent`: 监听合约事件

### 状态管理

- 使用 TanStack Query 管理异步状态和缓存
- 通过事件监听自动刷新相关数据
- 乐观更新提升用户体验

## 故障排除

1. **钱包连接失败**: 确保安装了 MetaMask 并切换到 Sepolia 网络
2. **交易失败**: 检查账户余额是否足够支付 Gas 费用
3. **数据不更新**: 刷新页面或检查网络连接
4. **构建失败**: 确保 Node.js 版本 >= 16，删除 node_modules 重新安装

## 许可证

MIT License
