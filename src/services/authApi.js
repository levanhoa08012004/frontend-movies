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

/** R57 — User cập nhật profile mình (name, avatar, dob, phone, gender, address). */
export async function updateMyProfile(patch = {}) {
  const body = {}
  // Chỉ forward field có gửi vào — undefined = giữ nguyên, null = clear field
  const allowed = ['name', 'avatar', 'dob', 'phone', 'gender', 'address']
  for (const k of allowed) {
    if (patch[k] !== undefined) body[k] = patch[k]
  }
  const res = await api.patch('/api/auth/me', body)
  return res.data?.data ?? res.data
}

/** Upload ảnh đại diện từ máy. Backend lưu file + set user.avatar = '/uploads/avatars/...' */
export async function uploadAvatar(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await api.post('/api/auth/me/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data?.data ?? res.data
}
