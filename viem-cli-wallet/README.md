# Viem CLI 钱包

基于 Viem.js 构建的命令行钱包，支持 Sepolia 测试网络上的 ETH 和 ERC20 代币操作。

## 功能特性

1. **生成私钥和地址** - 创建新的以太坊钱包
2. **KEYSTORE 加密** - 使用密码加密存储私钥（AES-256-CTR + Scrypt）
3. **查询余额** - 查看 ETH 和 ERC20 代币余额
4. **一键转账** - 自动构建、签名并发送 ERC20 转账交易（支持 EIP-1559）
5. **Dry-run 模式** - 测试交易构建和签名，但不发送到网络

## 安装和设置

1. 确保已安装 Node.js (版本 18 或更高)
2. 克隆或下载此项目
3. 安装依赖：
   ```bash
   npm install
   ```

4. 配置环境变量：
   - 复制 `.env` 文件并根据需要修改
   - 设置 Sepolia RPC URL (可使用 Infura、Alchemy 或公共 RPC)
   - 设置要操作的 ERC20 代币合约地址

## 使用方法

### 1. 生成新钱包
```bash
node wallet.js generate
```
这将生成一个新的私钥和地址，使用您设置的密码加密后保存到 `wallet.json` 文件中。

### 2. 查看钱包信息
```bash
node wallet.js info
```

### 3. 查询余额
```bash
# 查询 ETH 和默认 ERC20 代币余额
node wallet.js balance

# 查询指定 ERC20 代币余额
node wallet.js balance --token 0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238
```

### 4. 一键转账
```bash
# 直接转账（构建 + 签名 + 发送）
node wallet.js transfer --to 0x接收地址 --amount 10.5

# 指定代币合约地址
node wallet.js transfer --to 0x接收地址 --amount 10.5 --token 0x代币合约地址

# Dry-run 模式（仅测试，不发送）
node wallet.js transfer --to 0x接收地址 --amount 10.5 --dry-run
```

## 完整流程示例

```bash
# 1. 生成钱包
node wallet.js generate

# 2. 查看钱包信息
node wallet.js info

# 3. 查询余额（需要先向地址转入一些 ETH 和代币）
node wallet.js balance

# 4. 一键转账
node wallet.js transfer --to 0x742d35Cc6634C0532925a3b8D4C9db96c4b4d8b6 --amount 1.0
```

## 注意事项

⚠️ **安全提醒**：
- 私钥会保存在本地的 `wallet.json` 文件中，请妥善保管
- 不要在生产环境中使用此钱包
- 仅用于测试和学习目的
- 在 Sepolia 测试网络上操作，不会影响主网资产

## 获取测试代币

- **Sepolia ETH**: 可以从 [Sepolia Faucet](https://sepoliafaucet.com/) 获取
- **测试 ERC20 代币**: 可以部署自己的测试代币合约

## 文件说明

- `wallet.json` - 钱包私钥和地址信息（自动生成）

## 技术栈

- [Viem](https://viem.sh/) - 以太坊客户端库
- [Commander.js](https://github.com/tj/commander.js/) - 命令行界面
- [dotenv](https://github.com/motdotla/dotenv) - 环境变量管理

## 许可证

ISC License
