/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WALLETCONNECT_PROJECT_ID: string
  // 更多环境变量...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
