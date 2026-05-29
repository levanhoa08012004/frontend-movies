import api from './api'
import { unwrap } from '../utils/apiResponse'

/** Tránh gửi nhiều bản ghi "watch" cho cùng phim trong thời gian ngắn (Strict Mode, effect lặp, v.v.). */
const WATCH_DEDUP_MS = 90_000
const lastWatchSentAt = new Map()

export async function postBehavior(body) {
  await api.post('/api/user/behavior', body)
}

/**
 * Ghi nhận xem phim một lần mỗi cửa sổ thời gian cho mỗi (user, movie).
 * Không thay thế postBehavior cho các hành vi khác.
 */
export async function postWatchBehaviorDeduped(userId, movieId) {
  if (userId == null || movieId == null) return
  const mid = Number(movieId)
  if (!Number.isFinite(mid) || mid <= 0) return
  const key = `${userId}:${mid}`
  const now = Date.now()
  const prev = lastWatchSentAt.get(key) ?? 0
  if (now - prev < WATCH_DEDUP_MS) return
  lastWatchSentAt.set(key, now)
  await postBehavior({ movieId: mid, action: 'watch' })
}

export async function postFeedback(body) {
  await api.post('/api/user/feedback', body)
}

export async function history(params) {
  const res = await api.get('/api/user/history', { params })
  return unwrap(res)
}

export async function watchlist(params) {
  const res = await api.get('/api/user/watchlist', { params })
  return unwrap(res)
}

export async function addWatchlist(movieId) {
  await api.post(`/api/user/watchlist/${movieId}`)
}

export async function removeWatchlist(movieId) {
  await api.delete(`/api/user/watchlist/${movieId}`)
}
