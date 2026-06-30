import api from './api'
import { unwrap } from '../utils/apiResponse'

/** Tránh gửi nhiều bản ghi "watch" cho cùng (user, movie, episode) trong thời gian ngắn. */
const WATCH_DEDUP_MS = 90_000
const lastWatchSentAt = new Map()

export async function postBehavior(body) {
  await api.post('/api/user/behavior', body)
}

/**
 * Ghi nhận xem phim một lần mỗi cửa sổ thời gian. Nếu là phim bộ, hash key
 * bao gồm episodeNumber để mỗi tập tính là một lần xem riêng.
 *
 * @param {number} userId
 * @param {number} movieId
 * @param {{ episodeNumber?: number, watchDurationSec?: number }} [opts]
 */
export async function postWatchBehaviorDeduped(userId, movieId, opts = {}) {
  if (userId == null || movieId == null) return
  const mid = Number(movieId)
  if (!Number.isFinite(mid) || mid <= 0) return
  const ep = Number.isFinite(Number(opts.episodeNumber)) ? Number(opts.episodeNumber) : null
  const key = `${userId}:${mid}${ep != null ? `:ep${ep}` : ''}`
  const now = Date.now()
  const prev = lastWatchSentAt.get(key) ?? 0
  if (now - prev < WATCH_DEDUP_MS) return
  lastWatchSentAt.set(key, now)
  const payload = { movieId: mid, action: 'watch' }
  if (ep != null) payload.episodeNumber = ep
  if (Number.isFinite(Number(opts.watchDurationSec)) && Number(opts.watchDurationSec) > 0) {
    payload.watchDurationSec = Math.round(Number(opts.watchDurationSec))
  }
  await postBehavior(payload)
}

/**
 * Gửi cập nhật "đã xem N giây" cho 1 phiên xem hiện tại. Không dedup — hệ thống
 * sẽ ghi đè / append tuỳ logic backend (hiện tại append một row mới mỗi lần).
 * Dùng khi player phát hiện user đóng tab / chuyển tập.
 */
export async function postWatchDuration(movieId, watchDurationSec, episodeNumber) {
  const mid = Number(movieId)
  const sec = Number(watchDurationSec)
  if (!Number.isFinite(mid) || mid <= 0 || !Number.isFinite(sec) || sec <= 0) return
  const payload = { movieId: mid, action: 'watch', watchDurationSec: Math.round(sec) }
  if (Number.isFinite(Number(episodeNumber))) payload.episodeNumber = Number(episodeNumber)
  await postBehavior(payload)
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
