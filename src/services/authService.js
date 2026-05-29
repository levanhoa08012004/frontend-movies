import api, { ensureDeviceId } from './api'

function unwrap(payload) {
  if (payload && Object.prototype.hasOwnProperty.call(payload, 'data')) {
    return payload.data
  }
  return payload
}

export function getStoredAccessToken() {
  return localStorage.getItem('accessToken')
}

/** Đăng nhập — backend Spring: email + password + deviceId trong body {@link SignInRequest}. */
export async function login(email, password) {
  const res = await api.post('/api/auth/login', {
    email,
    password,
    deviceId: ensureDeviceId(),
    deviceName: 'VieStream Web',
  })
  const data = unwrap(res.data)
  if (data.accessToken) localStorage.setItem('accessToken', data.accessToken)
  if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken)
  return data
}

export async function fetchCurrentUser() {
  const res = await api.get('/api/auth/me')
  return unwrap(res.data)
}

export async function logoutApi() {
  try {
    if (getStoredAccessToken()) {
      await api.post('/api/auth/logout')
    }
  } catch {
    /* network / token invalid — vẫn xóa local */
  }
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
}

/** Google: gửi id_token lấy từ Google Identity Services. */
export async function loginWithGoogleIdToken(idToken) {
  const res = await api.post('/api/auth/google-login', {
    idToken,
    deviceId: ensureDeviceId(),
    deviceName: 'VieStream Web',
  })
  const data = unwrap(res.data)
  if (data.accessToken) localStorage.setItem('accessToken', data.accessToken)
  if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken)
  return data
}

export async function registerAccount({ email, password, name }) {
  const res = await api.post('/api/auth/register', {
    email,
    password,
    name: name || undefined,
    deviceId: ensureDeviceId(),
    deviceName: 'VieStream Web',
  })
  return unwrap(res.data)
}
