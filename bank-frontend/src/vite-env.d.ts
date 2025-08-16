/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BANK_ADDRESS: string
  readonly VITE_TARGET_CHAIN_ID: string
  readonly VITE_RPC_URL: string
  readonly VITE_WALLETCONNECT_PROJECT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
