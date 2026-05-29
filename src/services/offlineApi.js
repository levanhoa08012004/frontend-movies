import api from './api'
import { unwrap } from '../utils/apiResponse'

export async function recordOfflineDownload(body) {
  const res = await api.post('/api/user/offline-downloads', body)
  return unwrap(res)
}

export async function listOfflineDownloads(params) {
  const res = await api.get('/api/user/offline-downloads', { params })
  return unwrap(res)
}

export async function offlineQuota() {
  const res = await api.get('/api/user/offline-downloads/quota')
  return unwrap(res)
}
