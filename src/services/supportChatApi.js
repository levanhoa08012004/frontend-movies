import api from './api'
import { unwrap } from '../utils/apiResponse'

// ===== User-side =====
export async function getMyConversation() {
  const res = await api.get('/api/support/me/conversation')
  return unwrap(res)
}

export async function getMyMessages() {
  const res = await api.get('/api/support/me/conversation/messages')
  const d = unwrap(res)
  // Luôn trả MẢNG — phòng khi backend trả Page {content:[]} hoặc null → tránh crash messages.some()
  return Array.isArray(d) ? d : (Array.isArray(d?.content) ? d.content : [])
}

export async function sendMyMessage(content) {
  const res = await api.post('/api/support/me/messages', { content })
  return unwrap(res)
}

export async function markMyConversationRead() {
  await api.post('/api/support/me/conversation/mark-read')
}

// ===== CARE-side =====
export async function careListInbox({ mineOnly = false, page = 0, size = 30 } = {}) {
  const res = await api.get('/api/care/conversations', {
    params: { mineOnly, page, size },
  })
  return unwrap(res)
}

export async function careGetConversation(id) {
  const res = await api.get(`/api/care/conversations/${id}`)
  return unwrap(res)
}

export async function careGetMessages(id) {
  const res = await api.get(`/api/care/conversations/${id}/messages`)
  const d = unwrap(res)
  return Array.isArray(d) ? d : (Array.isArray(d?.content) ? d.content : [])
}

export async function careSendMessage(id, content) {
  const res = await api.post(`/api/care/conversations/${id}/messages`, { content })
  return unwrap(res)
}

export async function careAssign(id) {
  const res = await api.post(`/api/care/conversations/${id}/assign`)
  return unwrap(res)
}

export async function careClose(id) {
  const res = await api.post(`/api/care/conversations/${id}/close`)
  return unwrap(res)
}

export async function careMarkRead(id) {
  await api.post(`/api/care/conversations/${id}/mark-read`)
}
