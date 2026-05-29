import api from './api'
import { unwrap } from '../utils/apiResponse'

export async function listNotifications(params) {
  const res = await api.get('/api/user/notifications', { params })
  return unwrap(res)
}

export async function markNotificationRead(id) {
  await api.post(`/api/user/notifications/${id}/read`)
}
