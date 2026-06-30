import api from './api'
import { unwrap } from '../utils/apiResponse'

/** List tất cả items chia theo type + locked flag cho user hiện tại. */
export async function listMyCosmetics() {
  const res = await api.get('/api/profile/cosmetics')
  return unwrap(res)
}

/** Map type → item user đang equip. */
export async function myEquipped() {
  const res = await api.get('/api/profile/cosmetics/equipped')
  return unwrap(res)
}

/** Equipped items public của user khác (cho render comment chéo). */
export async function userEquipped(userId) {
  if (!userId) return {}
  const res = await api.get(`/api/users/${userId}/cosmetics`)
  return unwrap(res)
}

/** Equip 1 item (server tự xoá item cùng type đang equip). */
export async function equipItem(itemId) {
  const res = await api.post('/api/profile/cosmetics/equip', { itemId })
  return unwrap(res)
}

export async function unequipItem(type) {
  const res = await api.post('/api/profile/cosmetics/unequip', { type })
  return unwrap(res)
}
