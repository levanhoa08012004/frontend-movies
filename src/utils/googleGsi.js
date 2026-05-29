/** Tải thư viện Google Identity Services một lần. */
export function loadGoogleGsi() {
  if (typeof window !== 'undefined' && window.google?.accounts?.id) {
    return Promise.resolve()
  }
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-gsi="1"]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Google SDK')))
      return
    }
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.defer = true
    s.dataset.googleGsi = '1'
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Không tải được Google Sign-In'))
    document.body.appendChild(s)
  })
}

let gsiInitializedForClientId = null

/**
 * Gọi {@code google.accounts.id.initialize} tối đa một lần mỗi client_id (tránh cảnh báo GSI_LOGGER).
 * {@code getCredentialCallback} được gọi mỗi lần có credential — trả về handler hiện tại (vd ref từ nút đang mount).
 */
export function ensureGoogleIdentityInitialized(clientId, getCredentialCallback) {
  return loadGoogleGsi().then(() => {
    if (!clientId || typeof window === 'undefined' || !window.google?.accounts?.id) {
      return
    }
    if (gsiInitializedForClientId != null && gsiInitializedForClientId !== clientId) {
      try {
        window.google.accounts.id.cancel()
      } catch {
        /* ignore */
      }
      gsiInitializedForClientId = null
    }
    if (gsiInitializedForClientId !== clientId) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (resp) => {
          const cb = getCredentialCallback()
          if (!resp?.credential) {
            cb?.({ error: new Error('Thiếu id_token Google') })
            return
          }
          cb?.({ credential: resp.credential })
        },
        ux_mode: 'popup',
        auto_select: false,
      })
      gsiInitializedForClientId = clientId
    }
  })
}
