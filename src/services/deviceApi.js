import api from './api'
import { unwrap } from '../utils/apiResponse'

export async function registerDevice(body) {
  await api.post('/api/user/devices', body)
}

export async function listDevices() {
  const res = await api.get('/api/user/devices')
  return unwrap(res)
}

export async function revokeDevice(id) {
  await api.delete(`/api/user/devices/${id}`)
}
