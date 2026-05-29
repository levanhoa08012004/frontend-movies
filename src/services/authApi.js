import api from './api'

/** @returns {Promise<{ code?: number, message?: string, data?: unknown }>} */
export async function forgotPassword(email) {
  const res = await api.post('/api/auth/forgot-password', { email: String(email).trim() })
  return res.data
}

/** Đã đăng nhập — đổi mật khẩu (không gửi mail). @returns {Promise<{ message?: string }>} */
export async function changePassword({ currentPassword, newPassword }) {
  const res = await api.post('/api/auth/change-password', {
    currentPassword: String(currentPassword),
    newPassword: String(newPassword),
  })
  return res.data
}
