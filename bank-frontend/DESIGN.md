# Bank 合约前端设计文档（草案 v0.2）

> 目的：在实现代码前，对前端的功能范围、信息架构、交互流程、技术选型达成一致。本文档评审通过后再开始编码。

---

## 1. 目标与范围
- 为 `src/Bank.sol` 合约提供一个简单直观的前端界面，覆盖核心读写能力：
  - 连接钱包、显示当前账户与网络
  - 存款（deposit，payable）
  - 展示合约总余额、当前账户余额
  - 展示 Top 3 存款榜单
  - 管理员面板：提取指定金额、提取全部、更换管理员
- 环境支持：仅 Sepolia 测试网
- 不涵盖：生产级监控、复杂的多语言、隐私与合规等高级需求（后续可扩展）

## 2. 用户角色与典型场景
- 普通用户（任何地址）：
  1) 打开页面，连接钱包
  2) 查看合约总余额、自己的存款余额、Top 3 榜单
  3) 输入 ETH 金额进行存款，等待交易完成，界面自动刷新数据
- 管理员（合约 `admin` 地址）：
  1) 除上述功能外，拥有“提取指定金额”“提取全部”“更换管理员”的操作入口

## 3. 功能清单
- 钱包与网络
  - 连接/断开钱包，显示当前账户与网络名称/ChainId
  - 网络不匹配时提示切换到 Sepolia
- 读数据
  - `getContractBalance()` 合约余额
  - `getBalance(address)` 当前账户余额
  - `getTopDepositors()` Top 3 榜单（地址+金额）
  - `admin()` 当前管理员地址
- 写操作
  - `deposit()`：输入 ETH 金额（>0），发起 payable 交易
  - `withdraw(amount)`：管理员操作
  - `withdrawAll()`：管理员操作
  - `changeAdmin(newAdmin)`：管理员操作（默认隐藏，作为“高级”功能，待评审）
- 事件订阅/更新
  - `Deposit(address,uint256)`、`Withdraw(address,uint256)`、`TopDepositorsUpdated()`：用于驱动 UI 实时刷新
- 体验
  - 金额单位切换与格式化（ETH <-> Wei）
  - Loading、Pending、Success、Error 等状态提示
  - 失败原因展示（用户拒签、余额不足、Gas 不足、权限不足等）

## 4. 信息架构与页面结构
- 单页应用（SPA），主页面分区：
  1) 顶部导航：项目标题、连接钱包按钮、网络状态
  2) 概览区：合约总余额（ETH），当前账户余额（ETH）
  3) 存款表单区：输入框（ETH）、存款按钮、表单校验与交易状态
  4) Top 3 榜单：地址缩写、金额（ETH），支持复制地址
  5) 交易历史：基于事件显示存款/提取记录
  6) 管理员面板（仅 admin 可见）：提取金额、提取全部、更换管理员

## 5. 合约交互设计
- 地址与 ABI 来源
  - 合约地址：`0xb5dAa05466c04dd1a06212aF041c4945fc4d270F`（Sepolia）
  - ABI 来源：`C:\Work\Web3\hello-foundry\out\Bank.sol\Bank.json`
- 只读调用
  - `getContractBalance()`、`getBalance(account)`、`getTopDepositors()`、`admin()`
- 交易调用
  - `deposit({ value: parseEther(amount) })`
  - `withdraw(amount)`（仅管理员）
  - `withdrawAll()`（仅管理员）
  - `changeAdmin(newAdmin)`（仅管理员）
- 事件监听
  - 监听 `Deposit`、`Withdraw`、`TopDepositorsUpdated`
  - 收到事件时刷新相关数据（最小刷新：避免全量 refetch）
- 数据更新策略
  - 初次加载：并行读取 admin、合约余额、账户余额、Top 3
  - 写操作发起后：
    - 乐观更新（可选）+ 监听交易回执
    - 收到事件或区块确认后再校准数值

## 6. 技术选型（建议）
- 构建：Vite + React + TypeScript
- Web3：wagmi + viem（现代、类型友好）；可替代：ethers v6
- 状态与数据：
  - wagmi 自带的 react-query 风格 hooks 负责链上数据缓存与刷新
  - 组件局部状态使用 React state；必要时使用 Zustand
- UI 与样式：Tailwind CSS
- 质量：ESLint + Prettier + Type-Check（tsc）
- 测试：暂不引入测试框架

## 7. 目录结构（草案）
```
bank-frontend/
  DESIGN.md                # 本文档
  (后续实现开始后新增)
  src/
    app/App.tsx
    components/
      WalletConnect.tsx
      BalanceCard.tsx
      DepositForm.tsx
      Top3List.tsx
      AdminPanel.tsx
    hooks/
      useBankContract.ts   # 封装 abi/address 与读写 hooks
    lib/
      contract.ts          # 合同地址/ABI、格式化、工具方法
    config/
      chains.ts            # 链配置（sepolia）
    types/
      bank.ts              # TopDepositor 等类型
  .env.example             # VITE_BANK_ADDRESS、VITE_CHAIN_ID
  index.html
  package.json
  tsconfig.json
  tailwind.config.js
```

## 8. 关键交互与状态机
- 连接钱包
  - 若未连接：显示“连接钱包”按钮
  - 连接后：显示地址缩写、复制、断开入口
  - 网络不匹配：提示切换到 Sepolia（按钮调用钱包切换网络）
- 存款流程
  1) 输入金额（ETH）；校验 > 0，且格式正确
  2) 点击“存款”，发起交易；按钮进入 loading，显示 Pending Hash
  3) 交易回执或事件触发后：刷新账户余额、合约余额、Top 3；展示成功提示
- 提取流程（管理员）
  - 金额提取：输入金额（ETH）-> 发起交易 -> 刷新合约余额；展示成功/失败
  - 全额提取：按钮 -> 发起交易 -> 刷新合约余额
- Top 3 展示
  - 空数据或 0 金额时的占位展示
  - 地址过长省略中间字符，支持复制

## 9. 校验与错误处理
- 金额输入：仅正数，保留合理小数位（最多 18 位），禁止非数字字符
- 账户余额不足、Gas 不足：前端给出明显提示
- 权限不足（非管理员调用管理员方法）：按钮禁用并提示
- 用户拒签、RPC 错误、链切换失败：统一错误提示条

## 10. 权限与可见性
- isAdmin = `connectedAddress.toLowerCase() === admin.toLowerCase()`
- 管理员区块仅在 isAdmin 为真时可见
- `changeAdmin` 需二次确认

## 11. 环境与配置
- 支持网络：
  - 测试网：Sepolia（ChainId 11155111）
- 配置项（.env.example）：
  - `VITE_BANK_ADDRESS=0xb5dAa05466c04dd1a06212aF041c4945fc4d270F`
  - `VITE_TARGET_CHAIN_ID=11155111`
  - `VITE_RPC_URL=https://sepolia.infura.io/v3/dca2a8416ac24058860426614449251d`

## 12. 格式化与显示
- 金额显示：使用 `formatEther`，最多 4~6 位小数，悬停显示完整值
- 地址显示：`0x1234...abcd` 形式，点击复制
- 时间/相对时间（若显示交易时间）：dayjs（可选）

## 13. 无障碍与移动端
- 表单元素具备 label、键盘可访问性
- 颜色对比度达标
- 移动端：栅格布局自适应，按钮易点

## 14. 性能与刷新策略
- 首屏并行拉取数据
- 使用 wagmi/viem 的缓存与去抖刷新，避免高频重复请求
- 事件驱动 + 轻量轮询作为兜底（如每 15~30s）

## 15. 边界与风控
- Top 3 金额并列：按金额降序，金额相同按地址字典序或保持合约返回顺序（UI 层仅展示，不做再次排序）
- Top 3 初始为空：显示占位“暂无数据”
- 超大金额与精度：统一用 BigInt/字符串处理，避免 JS 浮点误差
- 交易失败与回滚：必须在 UI 显示并可重试
- 安全提示：切勿在不可信网络上操作；管理员操作需二次确认

## 16. 指标与日志（可选）
- 基础埋点：存款/提取按钮点击、交易成功/失败
- 错误日志：Sentry（可选，后续再加）

## 17. 测试计划
- 暂不引入测试框架，先完成基础功能实现
- 手动测试：
  - 在 Sepolia 网络上连接钱包
  - 正常存款 -> 余额/Top 3 更新
  - 管理员提取 -> 合约余额减少
  - 事件触发 -> UI 自动刷新

## 18. 验收标准（DoD）
- 可在 Sepolia 网络上：连接钱包、完成一次存款并看到余额与 Top 3 更新
- 管理员地址登录可成功提取指定金额与全部金额
- 管理员可成功更换管理员地址
- 网络不匹配时给出清晰提示并可一键切换到 Sepolia
- 错误与加载状态清晰可见；金额显示格式正确

## 19. 开发里程碑（建议）
- M0：设计评审通过（本文档）
- M1：项目脚手架与基础配置（Vite/React/TS、wagmi/viem、Tailwind、ESLint/Prettier）
- M2：只读数据展示（admin、合约余额、账户余额、Top 3）
- M3：存款流程与状态提示
- M4：管理员面板（提取金额/全部、二次确认）
- M5：事件订阅与最小刷新、边界处理
- M6：打包与文档完善

## 20. 已确认需求
1) ✅ 需要暴露 `changeAdmin` 功能，增加二次确认
2) ✅ UI 风格：Tailwind CSS
3) ✅ 需要显示交易历史列表（基于事件/区块扫描）
4) ✅ 不需要法币换算
5) ✅ 目标网络：仅 Sepolia 测试网
6) ✅ Top 3 排名相同时不需要在 UI 再次稳定化

---

如对以上方案有修改建议，请直接标注章节与条目。我会根据你的反馈更新设计文档并再提交 v0.2 草案。
