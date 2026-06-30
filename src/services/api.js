import axios from 'axios'

const DEVICE_KEY = 'deviceId'

export function ensureDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
})

/**
 * Decode JWT payload (không verify chữ ký — chỉ đọc exp claim).
 * Trả về null nếu không parse được.
 */
function decodeJwtPayload(token) {
  if (!token) return null
  try {
    const part = token.split('.')[1]
    if (!part) return null
    // base64url → base64 + padding
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/')
    const pad = b64.length % 4 === 0 ? b64 : b64 + '='.repeat(4 - (b64.length % 4))
    return JSON.parse(atob(pad))
  } catch { return null }
}

/** True nếu access token sẽ hết hạn trong < {@code thresholdSec} giây. */
function isAccessTokenExpiringSoon(thresholdSec = 60) {
  const payload = decodeJwtPayload(localStorage.getItem('accessToken'))
  if (!payload || !payload.exp) return false
  return payload.exp * 1000 - Date.now() < thresholdSec * 1000
}

api.interceptors.request.use(async (config) => {
  // PROACTIVE refresh: nếu token sắp/đã hết hạn → refresh TRƯỚC khi gửi.
  // Bỏ qua cho chính endpoint auth (login/register/refresh) để không đệ quy.
  if (
    !isAuthEndpoint(config.url || '') &&
    localStorage.getItem('refreshToken') &&
    isAccessTokenExpiringSoon(60)
  ) {
    try {
      if (isRefreshing) {
        // Đợi refresh đang chạy xong
        await new Promise((resolve) => {
          const wait = () => (isRefreshing ? setTimeout(wait, 50) : resolve())
          wait()
        })
      } else {
        isRefreshing = true
        try {
          await performTokenRefresh()
        } finally {
          isRefreshing = false
        }
      }
    } catch {
      // Refresh fail → để 401 flow xử lý đẩy login
    }
  }
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  config.headers['X-Device-Id'] = ensureDeviceId()
  return config
})

// ============================================================================
// Token auto-refresh (Round 19)
// ----------------------------------------------------------------------------
// Flow khi server trả 401:
//  1. Nếu request là /api/auth/refresh-token hoặc /api/auth/login → bỏ qua, throw.
//  2. Nếu chưa có refreshToken trong localStorage → kick về /login.
//  3. Nếu đang có refresh đang chạy → queue request hiện tại, retry khi refresh xong.
//  4. Gọi POST /api/auth/refresh-token (header x-token = refreshToken).
//  5. Refresh thành công → lưu accessToken mới → retry tất cả request đã queue.
//  6. Refresh fail → xoá token + redirect /login.
// ============================================================================

let isRefreshing = false
let refreshQueue = [] // { resolve, reject, config }

function flushQueue(error, newToken) {
  refreshQueue.forEach(({ resolve, reject, config }) => {
    if (error) {
      reject(error)
    } else {
      config.headers.Authorization = `Bearer ${newToken}`
      resolve(api(config))
    }
  })
  refreshQueue = []
}

async function performTokenRefresh() {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) throw new Error('no_refresh_token')
  // Dùng axios trần (không qua interceptor) để tránh đệ quy 401-refresh.
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
  const res = await axios.post(
    `${baseURL}/api/auth/refresh-token`,
    null,
    {
      headers: {
        'x-token': refreshToken,
        'X-Device-Id': ensureDeviceId(),
      },
    }
  )
  const payload = res.data?.data ?? res.data
  const accessToken = payload?.accessToken
  const newRefresh = payload?.refreshToken
  if (!accessToken) throw new Error('no_access_token_returned')
  localStorage.setItem('accessToken', accessToken)
  if (newRefresh) localStorage.setItem('refreshToken', newRefresh)
  return accessToken
}

function isAuthEndpoint(url = '') {
  return (
    url.includes('/api/auth/refresh-token') ||
    url.includes('/api/auth/login') ||
    url.includes('/api/auth/google-login') ||
    url.includes('/api/auth/register')
  )
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    const status = err.response?.status

    if (status !== 401 || !original || original._retried || isAuthEndpoint(original.url || '')) {
      // Không phải 401, hoặc đã retry rồi, hoặc là endpoint auth — handle như cũ.
      if (status === 401) {
        // Endpoint auth thì cứ kick về login (sai mật khẩu / refresh hết hạn).
        if (isAuthEndpoint(original?.url || '')) {
          // không clear ngay — Login.jsx tự xử lý lỗi
        } else if (original?._retried) {
          // Đã thử refresh nhưng vẫn 401 → giấy thông hành hết hạn thật sự.
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          const path = window.location.pathname || ''
          const publicAuthPaths = ['/login', '/register', '/quen-mat-khau', '/dat-lai-mat-khau']
          if (!publicAuthPaths.includes(path)) window.location.href = '/login'
        }
      }
      return Promise.reject(err)
    }

    // 401 lần đầu — thử refresh
    original._retried = true

    // Nếu chưa có refreshToken → kick login luôn
    if (!localStorage.getItem('refreshToken')) {
      localStorage.removeItem('accessToken')
      const path = window.location.pathname || ''
      const publicAuthPaths = ['/login', '/register', '/quen-mat-khau', '/dat-lai-mat-khau']
      if (!publicAuthPaths.includes(path)) window.location.href = '/login'
      return Promise.reject(err)
    }

    // Đã có refresh đang chạy — queue và đợi
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject, config: original })
      })
    }

    isRefreshing = true
    try {
      const newToken = await performTokenRefresh()
      flushQueue(null, newToken)
      original.headers.Authorization = `Bearer ${newToken}`
      return api(original)
    } catch (refreshErr) {
      flushQueue(refreshErr, null)
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      const path = window.location.pathname || ''
      const publicAuthPaths = ['/login', '/register', '/quen-mat-khau', '/dat-lai-mat-khau']
      if (!publicAuthPaths.includes(path)) window.location.href = '/login'
      return Promise.reject(refreshErr)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
