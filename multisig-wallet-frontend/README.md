# 多签钱包前端

基于 React + TypeScript + wagmi + viem + AppKit 构建的多签钱包前端应用。

## 功能特性

- 🔗 **钱包连接**: 使用 AppKit 支持多种钱包连接
- 💰 **资产管理**: 查看 ETH 余额和 ERC20 代币
- 📝 **交易管理**: 创建、确认、执行多签交易
- 🔄 **实时更新**: 基于事件的状态同步
- 🎨 **现代界面**: 模仿 Safe 多签钱包的设计风格

## 技术栈

- **前端框架**: React 18 + TypeScript
- **Web3 库**: wagmi + viem
- **钱包连接**: AppKit (Reown)
- **状态管理**: Zustand
- **UI 组件**: Ant Design
- **样式方案**: Tailwind CSS
- **构建工具**: Vite

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 环境配置

复制 `.env.example` 到 `.env` 并填入配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
VITE_MORALIS_API_KEY=your_moralis_api_key
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

### 3. 启动开发服务器

```bash
npm run dev
```

### 4. 访问应用

打开浏览器访问 `http://localhost:5173`，并在 URL 中添加多签钱包地址参数：

```
http://localhost:5173/home?wallet=0x9e25904178979cb0Aa04E13e1D291e5d3B4FE000
```

## 使用说明

### URL 参数

应用需要通过 URL 参数指定多签钱包合约地址：

- `?wallet=0x...` - 多签钱包合约地址（必需）

### 页面功能

1. **概览页面** (`/home`)
   - 显示钱包基本信息
   - 快速创建交易入口

2. **资产页面** (`/assets`)
   - ETH 余额管理
   - ERC20 代币列表
   - 发送功能入口

3. **交易页面** (`/transactions`)
   - 交易列表查看
   - 交易确认和执行
   - 创建新交易

4. **创建交易页面** (`/create-transaction`)
   - 合约调用交易创建
   - 表单验证和提示

5. **发送 ETH 页面** (`/send-eth`)
   - 专门的 ETH 转账功能

6. **发送代币页面** (`/send-token`)
   - ERC20 代币转账功能

7. **设置页面** (`/settings`)
   - 多签配置查看
   - 持有人信息

## 构建部署

### 构建生产版本

```bash
npm run build
```

### 部署到 Vercel

1. 将代码推送到 Git 仓库
2. 在 Vercel 中导入项目
3. 设置环境变量：
   - `VITE_MORALIS_API_KEY`
   - `VITE_WALLETCONNECT_PROJECT_ID`
4. 部署完成

## 开发说明

### 合约 ABI 更新

如果合约 ABI 发生变化，需要更新 `wagmi.config.ts` 中的 ABI 定义，然后运行：

```bash
npm run wagmi
```

### 代码结构

```
src/
├── components/          # React 组件
├── hooks/              # 自定义 Hooks
├── services/           # 服务层
├── store/              # Zustand 状态管理
├── config/             # 配置文件
├── types/              # TypeScript 类型
└── utils/              # 工具函数
```

## 注意事项

1. **网络支持**: 目前仅支持 Sepolia 测试网
2. **合约地址**: 必须通过 URL 参数传入，不支持默认地址
3. **代币支持**: 支持 ERC20 代币，但不显示价格和图标
4. **浏览器兼容**: 支持现代浏览器，需要 Web3 钱包扩展

## 许可证

MIT License
