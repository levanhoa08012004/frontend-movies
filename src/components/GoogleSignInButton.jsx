import { useEffect, useRef, useState } from 'react'
import { ensureGoogleIdentityInitialized } from '../utils/googleGsi.js'

/**
 * Hiển thị nút "Đăng nhập Google" qua GIS. Gọi onCredential({credential}) hoặc onCredential({error}).
 */
export default function GoogleSignInButton({
  onCredential,
  disabled = false,
  text = 'continue_with',
  theme = 'filled_black',
  size = 'large',
}) {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
  const hostRef = useRef(null)
  const cbRef = useRef(onCredential)
  const [gsiError, setGsiError] = useState('')
  cbRef.current = onCredential

  useEffect(() => {
    if (!googleClientId || typeof window === 'undefined') return undefined
    let cancelled = false
    ensureGoogleIdentityInitialized(googleClientId, () => cbRef.current)
      .then(() => {
        if (cancelled || !hostRef.current || !window.google?.accounts?.id) return
        try {
          hostRef.current.innerHTML = ''
          window.google.accounts.id.renderButton(hostRef.current, {
            type: 'standard',
            theme,
            size,
            text,
            shape: 'rectangular',
            width: 360,
            locale: 'vi',
          })
        } catch (e) {
          setGsiError(e.message || 'Không vẽ được nút Google')
        }
      })
      .catch((e) => {
        if (!cancelled) setGsiError(e.message || 'Lỗi Google Sign-In')
      })
    return () => {
      cancelled = true
    }
  }, [googleClientId, theme, size, text])

  if (!googleClientId) {
    return (
      <p className="rounded-lg border border-amber-500/30 bg-amber-950/40 px-3 py-2 text-xs text-amber-100/90">
        Chưa cấu hình đăng nhập Google: thêm <span className="font-mono">VITE_GOOGLE_CLIENT_ID</span> (cùng Client ID
        với backend <span className="font-mono">GOOGLE_CLIENT_ID</span>) và nguồn gốc JS{' '}
        <span className="font-mono">http://localhost:5173</span> trong Google Cloud Console.
      </p>
    )
  }

  return (
    <div className="w-full">
      {gsiError ? (
        <p className="mb-2 rounded-lg border border-red-500/40 bg-red-950/50 px-3 py-2 text-xs text-red-200">
          {gsiError}
        </p>
      ) : null}
      <div
        ref={hostRef}
        className={disabled ? 'pointer-events-none opacity-50' : ''}
        aria-label="Đăng nhập bằng Google"
      />
    </div>
  )
}
