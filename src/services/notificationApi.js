import api from './api'
import { unwrap } from '../utils/apiResponse'

// ===== User-facing =====
export async function listNotifications(params) {
  const res = await api.get('/api/user/notifications', { params })
  return unwrap(res)
}

export async function getUnreadCount() {
  const res = await api.get('/api/user/notifications/unread-count')
  return unwrap(res)?.unread ?? 0
}

export async function markNotificationRead(id) {
  await api.post(`/api/user/notifications/${id}/read`)
}

export async function markAllRead() {
  const res = await api.post('/api/user/notifications/read-all')
  return unwrap(res)?.updated ?? 0
}

// ===== Admin: Notification Categories (read-only registry + toggle) =====
export async function adminListCategories() {
  const res = await api.get('/api/admin/notification-categories')
  return unwrap(res) ?? []
}

export async function adminToggleCategory(eventKey, enabled) {
  const res = await api.patch(`/api/admin/notification-categories/${eventKey}`, { enabled })
  return unwrap(res)
}

// ===== Admin: Notification Templates (CRUD + send) =====
export async function adminListTemplates(categoryKey) {
  const params = categoryKey ? { categoryKey } : {}
  const res = await api.get('/api/admin/notification-templates', { params })
  return unwrap(res) ?? []
}

export async function adminCreateTemplate(body) {
  const res = await api.post('/api/admin/notification-templates', body)
  return unwrap(res)
}

export async function adminUpdateTemplate(id, body) {
  const res = await api.patch(`/api/admin/notification-templates/${id}`, body)
  return unwrap(res)
}

export async function adminDeleteTemplate(id) {
  await api.delete(`/api/admin/notification-templates/${id}`)
}

export async function adminSendTemplate(id) {
  const res = await api.post(`/api/admin/notification-templates/${id}/send`)
  return unwrap(res)
}
