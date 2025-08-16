#!/usr/bin/env node

import { Command } from 'commander';
import {
  createWalletClient,
  createPublicClient,
  http,
  parseEther,
  parseUnits,
  formatEther,
  formatUnits
} from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount, generatePrivateKey, toAccount } from 'viem/accounts';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { createInterface } from 'readline';

// 加载环境变量
dotenv.config();

const program = new Command();

// ERC20 ABI (只包含我们需要的函数)
const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{ "name": "_owner", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "balance", "type": "uint256" }],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      { "name": "_to", "type": "address" },
      { "name": "_value", "type": "uint256" }
    ],
    "name": "transfer",
    "outputs": [{ "name": "", "type": "bool" }],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{ "name": "", "type": "uint8" }],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{ "name": "", "type": "string" }],
    "type": "function"
  }
];

// 创建公共客户端
const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org')
});

// 钱包文件路径
const WALLET_FILE = path.join(process.cwd(), 'wallet.json');

// 获取钱包密码（从环境变量）
function getWalletPassword() {
  const password = process.env.WALLET_PASSWORD;
  if (!password) {
    throw new Error('请在 .env 文件中设置 WALLET_PASSWORD');
  }
  return password;
}

// 手动输入密码
function getPasswordInput(prompt = '请输入钱包密码: ') {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log(prompt + '(输入后按回车)');
    rl.question('', (password) => {
      rl.close();
      resolve(password.trim());
    });
  });
}

// 生成 KEYSTORE
async function generateKeystore(privateKey, password) {
  const account = privateKeyToAccount(privateKey);

  // 简化的 KEYSTORE 格式（使用 AES-256-CTR 加密）
  const crypto = await import('crypto');
  const salt = crypto.randomBytes(32);
  const key = crypto.scryptSync(password, salt, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-ctr', key, iv);

  let encrypted = cipher.update(privateKey.slice(2), 'hex', 'hex');
  encrypted += cipher.final('hex');

  return {
    version: 1,
    id: crypto.randomUUID(),
    address: account.address,
    crypto: {
      cipher: 'aes-256-ctr',
      ciphertext: encrypted,
      iv: iv.toString('hex'),
      kdf: 'scrypt',
      kdfparams: {
        salt: salt.toString('hex'),
        n: 262144,
        r: 8,
        p: 1,
        dklen: 32
      }
    },
    createdAt: new Date().toISOString()
  };
}

// 解密 KEYSTORE
async function decryptKeystore(keystore, password) {
  const crypto = await import('crypto');
  const salt = Buffer.from(keystore.crypto.kdfparams.salt, 'hex');
  const key = crypto.scryptSync(password, salt, 32);
  const iv = Buffer.from(keystore.crypto.iv, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-ctr', key, iv);

  let decrypted = decipher.update(keystore.crypto.ciphertext, 'hex', 'hex');
  decrypted += decipher.final('hex');

  return '0x' + decrypted;
}

// 保存加密钱包到文件
async function saveWallet(privateKey, password) {
  const keystore = await generateKeystore(privateKey, password);
  fs.writeFileSync(WALLET_FILE, JSON.stringify(keystore, null, 2));
  console.log(`加密钱包已保存到 ${WALLET_FILE}`);
  return keystore;
}

// 从文件加载并解密钱包
async function loadWallet(password) {
  if (!fs.existsSync(WALLET_FILE)) {
    console.log('钱包文件不存在，请先生成钱包');
    return null;
  }

  try {
    const keystore = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf8'));
    const privateKey = await decryptKeystore(keystore, password);

    return {
      privateKey,
      address: keystore.address,
      createdAt: keystore.createdAt
    };
  } catch (error) {
    console.error('❌ 密码错误或钱包文件损坏');
    return null;
  }
}

// 1. 生成私钥和地址
program
  .command('generate')
  .description('生成新的私钥和地址（使用环境变量密码加密）')
  .action(async () => {
    try {
      console.log('正在生成新的钱包...');

      // 获取密码
      const password = getWalletPassword();
      console.log('使用环境变量中的密码进行加密');

      // 生成私钥
      const privateKey = generatePrivateKey();

      // 从私钥创建账户
      const account = privateKeyToAccount(privateKey);

      console.log('✅ 钱包生成成功!');
      console.log(`地址: ${account.address}`);
      console.log('⚠️  私钥已使用密码加密存储！');

      // 保存加密钱包到文件
      await saveWallet(privateKey, password);

    } catch (error) {
      console.error('❌ 生成钱包失败:', error.message);
    }
  });

// 2. 查询余额
program
  .command('balance')
  .description('查询 ETH 和 ERC20 代币余额')
  .option('-t, --token <address>', 'ERC20 代币合约地址')
  .action(async (options) => {
    try {
      const password = getWalletPassword();
      const walletData = await loadWallet(password);
      if (!walletData) return;

      console.log(`查询地址: ${walletData.address}`);
      console.log('---');

      // 查询 ETH 余额
      const ethBalance = await publicClient.getBalance({
        address: walletData.address
      });

      console.log(`ETH 余额: ${formatEther(ethBalance)} ETH`);

      // 查询 ERC20 代币余额
      const tokenAddress = options.token || process.env.ERC20_CONTRACT_ADDRESS;
      if (tokenAddress) {
        console.log(`正在查询代币余额...`);

        try {
          const [balance, decimals, symbol] = await Promise.all([
            publicClient.readContract({
              address: tokenAddress,
              abi: ERC20_ABI,
              functionName: 'balanceOf',
              args: [walletData.address]
            }),
            publicClient.readContract({
              address: tokenAddress,
              abi: ERC20_ABI,
              functionName: 'decimals'
            }),
            publicClient.readContract({
              address: tokenAddress,
              abi: ERC20_ABI,
              functionName: 'symbol'
            })
          ]);

          const formattedBalance = formatUnits(balance, decimals);
          console.log(`${symbol} 余额: ${formattedBalance} ${symbol}`);

        } catch (tokenError) {
          console.log(`⚠️  无法查询代币余额: ${tokenError.message}`);
        }
      }

    } catch (error) {
      console.error('❌ 查询余额失败:', error.message);
    }
  });



// 一键转账 - 构建、签名、发送交易
program
  .command('transfer')
  .description('一键 ERC20 转账 (构建 + 签名 + 发送)')
  .requiredOption('-t, --to <address>', '接收地址')
  .requiredOption('-a, --amount <amount>', '转账数量')
  .option('--token <address>', 'ERC20 代币合约地址')
  .option('--dry-run', '仅构建和签名，不发送交易')
  .action(async (options) => {
    try {
      const password = getWalletPassword();
      const walletData = await loadWallet(password);
      if (!walletData) return;

      const tokenAddress = options.token || process.env.ERC20_CONTRACT_ADDRESS;
      if (!tokenAddress) {
        console.error('❌ 请提供 ERC20 代币合约地址');
        return;
      }

      console.log('🚀 开始一键转账流程...');
      console.log(`从: ${walletData.address}`);
      console.log(`到: ${options.to}`);
      console.log(`代币合约: ${tokenAddress}`);

      // 步骤 1: 获取代币信息
      console.log('\n📋 步骤 1/4: 获取代币信息...');
      const [decimals, symbol, balance] = await Promise.all([
        publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'decimals'
        }),
        publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'symbol'
        }),
        publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [walletData.address]
        })
      ]);

      console.log(`代币: ${symbol}, 精度: ${decimals}`);
      console.log(`当前余额: ${formatUnits(balance, decimals)} ${symbol}`);

      // 检查余额是否足够
      const amount = parseUnits(options.amount, decimals);
      if (balance < amount) {
        console.error(`❌ 余额不足！需要 ${options.amount} ${symbol}，但只有 ${formatUnits(balance, decimals)} ${symbol}`);
        return;
      }

      console.log(`转账数量: ${options.amount} ${symbol}`);

      // 步骤 2: 构建交易
      console.log('\n🔧 步骤 2/4: 构建交易...');
      const account = privateKeyToAccount(walletData.privateKey);

      // 获取当前 gas 价格和 nonce
      const [gasPrice, nonce, ethBalance] = await Promise.all([
        publicClient.getGasPrice(),
        publicClient.getTransactionCount({
          address: walletData.address
        }),
        publicClient.getBalance({
          address: walletData.address
        })
      ]);

      console.log(`ETH 余额: ${formatEther(ethBalance)} ETH`);
      console.log(`Nonce: ${nonce}`);

      // 构建交易数据
      const transferData = {
        to: tokenAddress,
        data: `0xa9059cbb${options.to.slice(2).padStart(64, '0')}${amount.toString(16).padStart(64, '0')}`,
        nonce,
        gas: 65000n,
        maxFeePerGas: gasPrice * 2n,
        maxPriorityFeePerGas: parseUnits('2', 'gwei'),
      };

      console.log(`Gas Limit: ${transferData.gas}`);
      console.log(`Max Fee Per Gas: ${formatUnits(transferData.maxFeePerGas, 'gwei')} Gwei`);
      console.log(`Max Priority Fee: ${formatUnits(transferData.maxPriorityFeePerGas, 'gwei')} Gwei`);

      // 估算 gas 费用
      const estimatedGasCost = transferData.gas * transferData.maxFeePerGas;
      console.log(`预估 Gas 费用: ${formatEther(estimatedGasCost)} ETH`);

      if (ethBalance < estimatedGasCost) {
        console.error(`❌ ETH 余额不足支付 Gas 费用！需要约 ${formatEther(estimatedGasCost)} ETH`);
        return;
      }

      // 步骤 3: 签名交易
      console.log('\n✍️  步骤 3/4: 签名交易...');
      const walletClient = createWalletClient({
        account,
        chain: sepolia,
        transport: http(process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org')
      });

      const signedTx = await walletClient.signTransaction(transferData);
      console.log('✅ 交易签名成功!');

      // 如果是 dry-run 模式，只显示信息不发送
      if (options.dryRun) {
        console.log('\n🔍 Dry Run 模式 - 交易未发送');
        console.log(`签名后的交易: ${signedTx}`);
        console.log('✅ Dry-run 完成！交易已构建和签名，但未发送到网络');
        return;
      }

      // 步骤 4: 发送交易
      console.log('\n📡 步骤 4/4: 发送交易到 Sepolia 网络...');
      const txHash = await publicClient.sendRawTransaction({
        serializedTransaction: signedTx
      });

      console.log('✅ 交易已发送!');
      console.log(`交易哈希: ${txHash}`);
      console.log(`Sepolia 浏览器链接: https://sepolia.etherscan.io/tx/${txHash}`);

      // 等待交易确认
      console.log('\n⏳ 等待交易确认...');
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
        timeout: 60000
      });

      if (receipt.status === 'success') {
        console.log('🎉 交易确认成功!');
        console.log(`区块号: ${receipt.blockNumber}`);
        console.log(`Gas 使用量: ${receipt.gasUsed}`);
        console.log(`实际 Gas 费用: ${formatEther(receipt.gasUsed * receipt.effectiveGasPrice)} ETH`);
        console.log('\n✅ 转账完成！');
      } else {
        console.log('❌ 交易失败');
      }

    } catch (error) {
      console.error('❌ 转账失败:', error.message);
    }
  });

// 显示钱包信息
program
  .command('info')
  .description('显示当前钱包信息')
  .option('-p, --password <password>', '钱包密码（如果不提供则手动输入）')
  .action(async (options) => {
    try {
      if (!fs.existsSync(WALLET_FILE)) {
        console.log('钱包文件不存在，请先生成钱包');
        return;
      }

      // 先显示基本信息（不需要密码）
      const keystore = JSON.parse(fs.readFileSync(WALLET_FILE, 'utf8'));
      console.log('钱包基本信息:');
      console.log(`地址: ${keystore.address}`);
      console.log(`创建时间: ${keystore.createdAt}`);
      console.log(`钱包版本: ${keystore.version}`);
      console.log(`加密算法: ${keystore.crypto.cipher}`);

      // 获取密码 - 优先使用命令行参数，否则手动输入
      let password;
      if (options.password) {
        password = options.password;
        console.log('\n使用命令行提供的密码...');
      } else {
        password = await getPasswordInput('\n请输入密码查看完整信息: ');
        console.log('\n使用手动输入的密码...');
      }

      // 验证密码是否与 .env 中的配置一致
      try {
        const envPassword = getWalletPassword();
        if (password !== envPassword) {
          console.error('❌ 提供的密码与 .env 文件中的 WALLET_PASSWORD 不匹配');
          return;
        }
        console.log('✅ 密码验证通过');
      } catch (error) {
        console.error('❌ 无法读取 .env 文件中的 WALLET_PASSWORD:', error.message);
        return;
      }

      const walletData = await loadWallet(password);
      if (!walletData) return;

      console.log('\n完整钱包信息:');
      console.log(`地址: ${walletData.address}`);
      console.log(`私钥: ${walletData.privateKey}`);
      console.log('⚠️  请妥善保管您的私钥，不要泄露给任何人！');
    } catch (error) {
      console.error('❌ 读取钱包信息失败:', error.message);
    }
  });

// 程序配置
program
  .name('viem-wallet')
  .description('基于 Viem.js 的 CLI 钱包')
  .version('1.0.0');

// 解析命令行参数
program.parse();
