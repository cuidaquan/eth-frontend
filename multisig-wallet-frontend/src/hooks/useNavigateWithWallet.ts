import { useNavigate, useSearchParams } from 'react-router-dom'

/**
 * 自定义导航 hook，确保在页面跳转时保持 wallet 参数
 */
export function useNavigateWithWallet() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const navigateWithWallet = (
    path: string | number,
    options?: { replace?: boolean; state?: any }
  ) => {
    // 如果是数字（如 -1），直接使用原生 navigate
    if (typeof path === 'number') {
      navigate(path)
      return
    }

    const walletParam = searchParams.get('wallet')
    const finalPath = walletParam ? `${path}?wallet=${walletParam}` : path

    if (options?.replace) {
      navigate(finalPath, { replace: true, state: options.state })
    } else {
      navigate(finalPath, { state: options?.state })
    }
  }

  return navigateWithWallet
}
