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

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  config.headers['X-Device-Id'] = ensureDeviceId()
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      const path = window.location.pathname || ''
      const publicAuthPaths = ['/login', '/register', '/quen-mat-khau', '/dat-lai-mat-khau']
      if (!publicAuthPaths.includes(path)) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
