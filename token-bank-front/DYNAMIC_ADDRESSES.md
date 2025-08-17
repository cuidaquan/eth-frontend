# 动态合约地址获取

## 优化目标

通过 TokenBank 合约动态获取 EXTENDED_ERC20 和 PERMIT2 合约地址，避免硬编码，提高配置的灵活性和可维护性。

## 实现原理

TokenBank 合约在构造函数中接收并存储了 token 和 permit2 的地址：

```solidity
constructor(address _token, address _permit2) {
    token = ExtendedERC20(_token);
    permit2 = IPermit2(_permit2);
}
```

并提供了相应的 getter 函数：

```solidity
function token() public view returns (ExtendedERC20);
function permit2() public view returns (IPermit2);
```

## 配置简化

### 修改前
```typescript
// src/contracts/config.ts
export const CONTRACTS = {
  EXTENDED_ERC20: '0x89865AAF2251b10ffc80CE4A809522506BF10bA2' as const,
  TOKEN_BANK: '0x376900F896C238361A0Ed638292Da27E3BF10B11' as const,
  PERMIT2: '0x000000000022D473030F116dDEE9F6B43aC78BA3' as const,
}
```

### 修改后
```typescript
// src/contracts/config.ts
export const CONTRACTS = {
  // 只需要配置 TokenBank 合约地址，其他地址通过合约动态获取
  TOKEN_BANK: '0x376900F896C238361A0Ed638292Da27E3BF10B11' as const,
}
```

## 技术实现

### 1. 状态管理
```typescript
interface ContractAddresses {
  tokenAddress: `0x${string}` | null
  permit2Address: `0x${string}` | null
}

const [contractAddresses, setContractAddresses] = useState<ContractAddresses>({
  tokenAddress: null,
  permit2Address: null
})
```

### 2. 动态获取地址
```typescript
const fetchContractAddresses = async () => {
  if (!publicClient) return

  try {
    const [tokenAddress, permit2Address] = await Promise.all([
      // 从 TokenBank 合约获取 token 地址
      publicClient.readContract({
        address: CONTRACTS.TOKEN_BANK,
        abi: TOKEN_BANK_ABI,
        functionName: 'token',
        args: []
      }),
      // 从 TokenBank 合约获取 permit2 地址
      publicClient.readContract({
        address: CONTRACTS.TOKEN_BANK,
        abi: TOKEN_BANK_ABI,
        functionName: 'permit2',
        args: []
      })
    ])

    setContractAddresses({
      tokenAddress: tokenAddress as `0x${string}`,
      permit2Address: permit2Address as `0x${string}`
    })
  } catch (error) {
    console.error('获取合约地址失败:', error)
  }
}
```

### 3. 生命周期管理
```typescript
// 初始化合约地址
useEffect(() => {
  if (publicClient) {
    fetchContractAddresses()
  }
}, [publicClient])

// 等待地址获取完成后再获取数据
useEffect(() => {
  if (isConnected && address && contractAddresses.tokenAddress) {
    fetchData()
  }
}, [isConnected, address, contractAddresses.tokenAddress])
```

### 4. 函数更新
所有使用硬编码地址的函数都更新为使用动态地址：

```typescript
// 修改前
address: CONTRACTS.EXTENDED_ERC20

// 修改后
address: contractAddresses.tokenAddress
```

## 优势

### 🔧 配置简化
- **减少配置项**: 从 3 个地址减少到 1 个地址
- **单一真相源**: TokenBank 合约是地址配置的唯一来源
- **避免不一致**: 消除了手动配置可能导致的地址不匹配

### 🚀 部署灵活性
- **环境适应**: 自动适应不同网络的合约部署
- **版本升级**: 只需更新 TokenBank 地址，其他地址自动获取
- **测试友好**: 测试环境可以使用不同的 token 和 permit2 地址

### 🛡️ 错误减少
- **消除硬编码**: 避免手动复制粘贴地址时的错误
- **自动同步**: 合约地址变更时自动同步
- **类型安全**: TypeScript 类型检查确保地址正确性

### 📈 可维护性
- **集中管理**: 所有地址配置集中在 TokenBank 合约中
- **减少维护**: 不需要在多个地方更新地址
- **清晰依赖**: 明确的依赖关系，TokenBank → Token/Permit2

## 使用流程

### 开发者视角
1. 部署 TokenBank 合约时传入正确的 token 和 permit2 地址
2. 在前端配置中只需要设置 TokenBank 地址
3. 应用启动时自动获取其他合约地址

### 用户视角
- 无感知变化，用户体验完全一致
- 应用启动时可能有轻微的初始化延迟（获取地址）

## 注意事项

### 初始化顺序
- 必须先获取合约地址，再执行其他操作
- 所有依赖动态地址的函数都需要检查地址是否已获取

### 错误处理
- 网络问题可能导致地址获取失败
- 需要适当的重试机制和错误提示

### 性能考虑
- 地址获取是一次性操作，不会影响后续性能
- 可以考虑缓存机制避免重复获取

## 结论

通过动态获取合约地址，我们实现了：

1. **配置简化** - 只需要配置一个 TokenBank 地址
2. **自动同步** - 其他地址自动从合约获取
3. **错误减少** - 避免手动配置错误
4. **灵活部署** - 适应不同环境和版本

这种方式更符合区块链应用的最佳实践，让合约成为配置的单一真相源。
