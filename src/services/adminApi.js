import api from './api'
import { unwrap } from '../utils/apiResponse'

export async function adminListUsers(params) {
  const res = await api.get('/api/admin/users', { params })
  return unwrap(res)
}

/** Admin catalogue: cùng tham số lọc như /api/movies; includeDeleted=true để gồm phim xóa mềm. */
export async function adminListMovies(params) {
  const res = await api.get('/api/admin/movies', { params })
  return unwrap(res)
}

export async function adminAnalyticsUsers(from, to) {
  const res = await api.get('/api/admin/analytics/users', {
    params: { from, to },
  })
  return unwrap(res)
}

export async function adminAnalyticsVip(from, to, newSubscriptionBucket) {
  const res = await api.get('/api/admin/analytics/vip', {
    params: { from, to, newSubscriptionBucket },
  })
  return unwrap(res)
}

export async function adminImportCatalog(body, pathImage) {
  const cfg = {}
  if (pathImage != null && String(pathImage).trim() !== '') {
    cfg.params = { pathImage: String(pathImage).trim() }
  }
  const res = await api.post('/api/admin/import/catalog', body, cfg)
  return unwrap(res)
}

export async function adminCreateUser(body) {
  const res = await api.post('/api/admin/users', body)
  return unwrap(res)
}

export async function adminPatchUser(id, body) {
  const res = await api.patch(`/api/admin/users/${id}`, body)
  return unwrap(res)
}

export async function adminPatchMovie(id, body) {
  const res = await api.patch(`/api/admin/movies/${id}`, body)
  return unwrap(res)
}

export async function adminDeleteMovie(id) {
  const res = await api.delete(`/api/admin/movies/${id}`)
  return unwrap(res)
}

// Round 16 — Admin Movie CRUD (create + detail)
export async function adminCreateMovie(body) {
  const res = await api.post('/api/admin/movies', body)
  return unwrap(res)
}

export async function adminGetMovie(id) {
  const res = await api.get(`/api/admin/movies/${id}`)
  return unwrap(res)
}

// Round 16 — Episodes
export async function adminListEpisodes(movieId) {
  const res = await api.get(`/api/admin/movies/${movieId}/episodes`)
  return unwrap(res)
}
export async function adminCreateEpisode(movieId, body) {
  const res = await api.post(`/api/admin/movies/${movieId}/episodes`, body)
  return unwrap(res)
}
export async function adminUpdateEpisode(movieId, episodeNumber, body) {
  const res = await api.patch(`/api/admin/movies/${movieId}/episodes/${episodeNumber}`, body)
  return unwrap(res)
}
export async function adminDeleteEpisode(movieId, episodeNumber) {
  const res = await api.delete(`/api/admin/movies/${movieId}/episodes/${episodeNumber}`)
  return unwrap(res)
}

// Round 16 — Episode sources (m3u8/embed per server)
export async function adminListEpisodeSources(movieId, episodeNumber) {
  const res = await api.get(`/api/admin/movies/${movieId}/episodes/${episodeNumber}/sources`)
  return unwrap(res)
}
export async function adminCreateEpisodeSource(movieId, episodeNumber, body) {
  const res = await api.post(`/api/admin/movies/${movieId}/episodes/${episodeNumber}/sources`, body)
  return unwrap(res)
}
export async function adminUpdateEpisodeSource(movieId, episodeNumber, sourceId, body) {
  const res = await api.patch(`/api/admin/movies/${movieId}/episodes/${episodeNumber}/sources/${sourceId}`, body)
  return unwrap(res)
}
export async function adminDeleteEpisodeSource(movieId, episodeNumber, sourceId) {
  const res = await api.delete(`/api/admin/movies/${movieId}/episodes/${episodeNumber}/sources/${sourceId}`)
  return unwrap(res)
}

// Round 18 — Benefit definitions (admin CRUD)
export async function adminListBenefitDefs() {
  const res = await api.get('/api/admin/vip/benefit-definitions')
  return unwrap(res)
}
export async function adminCreateBenefitDef(body) {
  const res = await api.post('/api/admin/vip/benefit-definitions', body)
  return unwrap(res)
}
export async function adminUpdateBenefitDef(code, body) {
  const res = await api.patch(`/api/admin/vip/benefit-definitions/${code}`, body)
  return unwrap(res)
}
export async function adminDeleteBenefitDef(code) {
  const res = await api.delete(`/api/admin/vip/benefit-definitions/${code}`)
  return unwrap(res)
}

// Round 18 — Cosmetic items (admin CRUD)
export async function adminListCosmeticItems(type) {
  const res = await api.get('/api/admin/vip/items', { params: type ? { type } : {} })
  return unwrap(res)
}
export async function adminCreateCosmeticItem(body) {
  const res = await api.post('/api/admin/vip/items', body)
  return unwrap(res)
}
export async function adminUpdateCosmeticItem(id, body) {
  const res = await api.patch(`/api/admin/vip/items/${id}`, body)
  return unwrap(res)
}
export async function adminDeleteCosmeticItem(id) {
  const res = await api.delete(`/api/admin/vip/items/${id}`)
  return unwrap(res)
}
