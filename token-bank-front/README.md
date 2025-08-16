# TokenBank Frontend

这是一个使用纯 Viem 构建的 TokenBank DApp 前端应用，无需 Wagmi 等额外依赖。

## 功能特性

- 🔗 连接 MetaMask 钱包
- 🪙 Mint 测试代币（仅合约拥有者可用）
- 💰 显示用户 Token 余额
- 🏦 显示用户在 TokenBank 的存款余额

- 💸 存款功能（使用 transferWithCallback）
- 💳 取款功能
- 📱 响应式设计

## 技术栈

- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Viem** - 以太坊交互库（纯 Viem，无 Wagmi 依赖）
- **Vite** - 构建工具

## 合约地址

- **ExtendedERC20**: `0x73f6DD16d0Aa5322560556605cf4c86Bd045Ee55`
- **TokenBank**: `0x826afd085C4cc7C92fF4271d4DC81B51DD449Eea`
- **网络**: Sepolia 测试网

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境

在使用前，请更新以下配置文件中的 API 密钥：

创建 `.env.local` 文件并配置你的 Infura Project ID:
```bash
# 复制 .env.example 为 .env.local
cp .env.example .env.local

# 编辑 .env.local 文件，填入你的 Infura Project ID
VITE_INFURA_KEY=your_infura_project_id_here
```

或者直接在 **src/hooks/useWallet.ts** 中替换:
```typescript
// 替换为你的 Infura Project ID
transport: http('https://sepolia.infura.io/v3/YOUR_INFURA_KEY')
```

### 3. 启动开发服务器

```bash
npm run dev
```

应用将在 `http://localhost:3000` 启动。

### 4. 构建生产版本

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

## 项目结构

```
src/
├── contracts/
│   ├── config.ts      # 合约地址配置
│   └── abis.ts        # 合约 ABI
├── hooks/
│   ├── useWallet.ts   # 钱包连接 Hook
│   └── useTokenBank.ts # TokenBank 合约交互 Hook
├── App.tsx            # 主应用组件
├── main.tsx           # 应用入口
└── index.css          # 样式文件
```

## 注意事项

1. **网络配置**: 确保钱包连接到 Sepolia 测试网
2. **Gas 费用**: 每次交易都需要支付 Sepolia ETH 作为 gas 费
3. **授权机制**: 存款前需要先授权 TokenBank 合约使用你的代币
4. **交易确认**: 所有交易都需要等待区块确认才能看到余额更新

## 故障排除

### 常见问题

1. **连接失败**
   - 确保安装了 MetaMask 浏览器扩展
   - 检查网络是否为 Sepolia 测试网

2. **交易失败**
   - 检查钱包中是否有足够的 ETH 支付 gas 费
   - 确保输入的金额不超过可用余额

3. **余额不更新**
   - 等待交易确认（通常需要几个区块）
   - 刷新页面重新加载数据

4. **授权问题**
   - 如果存款失败，可能需要先进行授权
   - 授权额度不足时会自动显示授权按钮

## 开发

如果你想修改或扩展这个应用：

1. 修改合约地址：更新 `src/contracts/config.ts`
2. 添加新功能：在 `src/App.tsx` 中添加新的合约调用
3. 修改样式：编辑 `src/index.css`
4. 添加新的合约函数：更新 `src/contracts/abis.ts`

## 许可证

MIT License
