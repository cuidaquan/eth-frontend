# 多签钱包前端部署指南

## 项目完成状态

✅ **基础架构完成**
- React 18 + TypeScript 项目结构
- wagmi + viem Web3 集成
- AppKit 钱包连接
- Ant Design + Tailwind CSS UI
- Zustand 状态管理

✅ **核心功能实现**
- 动态合约地址支持（通过 URL 参数）
- 钱包连接和账户管理
- 多签钱包数据读取
- 交易创建、确认、执行
- ETH 和 ERC20 代币支持
- 实时事件监听

✅ **页面组件完成**
- 概览页面（Dashboard）
- 资产管理页面（Assets）
- 交易管理页面（Transactions）
- 创建交易页面（CreateTransaction）
- 发送 ETH 页面（SendETH）
- 发送代币页面（SendToken）
- 设置页面（Settings）

## 部署步骤

### 1. 本地开发测试

```bash
# 进入项目目录
cd multisig-wallet-frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问: `http://localhost:5173/home?wallet=YOUR_CONTRACT_ADDRESS`

### 2. 构建生产版本

```bash
# 构建项目
npm run build

# 预览构建结果
npm run preview
```

### 3. 部署到 Vercel

#### 方法一：通过 Vercel CLI
```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel

# 设置环境变量
vercel env add VITE_MORALIS_API_KEY
vercel env add VITE_WALLETCONNECT_PROJECT_ID
```

#### 方法二：通过 Git 集成
1. 将代码推送到 GitHub/GitLab
2. 在 Vercel 控制台导入项目
3. 设置环境变量：
   - `VITE_MORALIS_API_KEY`
   - `VITE_WALLETCONNECT_PROJECT_ID`
4. 部署完成

## 使用说明

### 访问应用
部署完成后，访问 URL 格式：
```
https://your-app.vercel.app/home?wallet=0xYourMultiSigContractAddress
```

### 功能测试清单

#### 基础功能
- [ ] 钱包连接（MetaMask、WalletConnect 等）
- [ ] 切换到 Sepolia 测试网
- [ ] 输入有效的多签合约地址
- [ ] 查看钱包基本信息（余额、持有人、签名门槛）

#### 资产管理
- [ ] 查看 ETH 余额
- [ ] 查看 ERC20 代币列表
- [ ] 发送 ETH 功能
- [ ] 发送代币功能

#### 交易管理
- [ ] 查看交易列表
- [ ] 创建新交易（合约调用）
- [ ] 确认交易
- [ ] 执行交易
- [ ] 撤销确认

#### 界面功能
- [ ] 响应式布局
- [ ] 中文界面
- [ ] 错误提示
- [ ] 加载状态

## 配置说明

### 环境变量
```env
# Moralis API 密钥（用于代币数据）
VITE_MORALIS_API_KEY=your_moralis_api_key

# WalletConnect 项目 ID（用于钱包连接）
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

### 网络配置
- **支持网络**: Sepolia 测试网
- **Chain ID**: 11155111
- **RPC**: 自动使用 wagmi 默认配置

### 合约要求
- 必须是符合设计的多签钱包合约
- 部署在 Sepolia 测试网
- 包含所需的函数和事件

## 故障排除

### 常见问题

1. **"请指定多签钱包地址"**
   - 检查 URL 参数 `?wallet=0x...`
   - 确保地址格式正确

2. **钱包连接失败**
   - 安装 MetaMask 或其他 Web3 钱包
   - 切换到 Sepolia 测试网
   - 刷新页面重试

3. **交易数据不显示**
   - 确认合约地址正确
   - 检查合约是否部署在 Sepolia
   - 查看浏览器控制台错误

4. **代币余额不显示**
   - 检查 Moralis API 密钥
   - 确认钱包有 ERC20 代币
   - 检查网络连接

### 调试方法
- 打开浏览器开发者工具
- 查看 Console 标签页的错误信息
- 检查 Network 标签页的 API 请求
- 验证合约调用参数

## 技术架构

### 前端技术栈
- **React 18**: 用户界面框架
- **TypeScript**: 类型安全
- **wagmi + viem**: Web3 交互
- **AppKit**: 钱包连接
- **Ant Design**: UI 组件库
- **Tailwind CSS**: 样式框架
- **Zustand**: 状态管理
- **Vite**: 构建工具

### 项目结构
```
src/
├── components/     # React 组件
├── hooks/         # 自定义 Hooks
├── services/      # 服务层（Moralis API）
├── store/         # Zustand 状态管理
├── config/        # 配置文件
├── types/         # TypeScript 类型
└── generated.ts   # 合约 ABI
```

## 后续优化

### 功能扩展
- [ ] 支持更多网络（主网、其他测试网）
- [ ] 添加代币价格显示
- [ ] 实现移动端适配
- [ ] 添加交易历史导出
- [ ] 实现批量操作

### 技术优化
- [ ] 添加单元测试
- [ ] 实现 E2E 测试
- [ ] 优化性能和加载速度
- [ ] 添加错误监控
- [ ] 实现 PWA 功能

## 联系支持

如果在部署或使用过程中遇到问题，请：
1. 检查本文档的故障排除部分
2. 查看浏览器控制台错误信息
3. 确认合约地址和网络配置
4. 验证环境变量设置

---

**项目状态**: ✅ 可部署使用  
**最后更新**: 2025-08-15  
**版本**: v1.0.0
