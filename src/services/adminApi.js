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
