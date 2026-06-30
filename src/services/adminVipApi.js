import api from './api'
import { unwrap } from '../utils/apiResponse'

// Tier levels
export async function adminListTiers() {
  return unwrap(await api.get('/api/admin/vip/tiers'))
}
export async function adminCreateTier(body) {
  return unwrap(await api.post('/api/admin/vip/tiers', body))
}
export async function adminUpdateTier(code, body) {
  return unwrap(await api.patch(`/api/admin/vip/tiers/${code}`, body))
}
export async function adminDeleteTier(code) {
  return unwrap(await api.delete(`/api/admin/vip/tiers/${code}`))
}
export async function adminHardDeleteTier(code) {
  return unwrap(await api.delete(`/api/admin/vip/tiers/${code}/hard`))
}

// Plans
export async function adminListPlans() {
  return unwrap(await api.get('/api/admin/vip/plans'))
}
export async function adminCreatePlan(body) {
  return unwrap(await api.post('/api/admin/vip/plans', body))
}
export async function adminUpdatePlan(id, body) {
  return unwrap(await api.patch(`/api/admin/vip/plans/${id}`, body))
}
export async function adminDeletePlan(id) {
  return unwrap(await api.delete(`/api/admin/vip/plans/${id}`))
}

// Benefits
export async function adminListBenefitCodes() {
  return unwrap(await api.get('/api/admin/vip/benefit-codes'))
}
export async function adminListBenefitsForTier(code) {
  return unwrap(await api.get(`/api/admin/vip/tiers/${code}/benefits`))
}
export async function adminReplaceBenefitsForTier(code, body) {
  return unwrap(await api.put(`/api/admin/vip/tiers/${code}/benefits`, body))
}

// Round 18 — Benefit definitions
export async function adminListBenefitDefs() {
  return unwrap(await api.get('/api/admin/vip/benefit-definitions'))
}
export async function adminCreateBenefitDef(body) {
  return unwrap(await api.post('/api/admin/vip/benefit-definitions', body))
}
export async function adminUpdateBenefitDef(code, body) {
  return unwrap(await api.patch(`/api/admin/vip/benefit-definitions/${code}`, body))
}
export async function adminDeleteBenefitDef(code) {
  return unwrap(await api.delete(`/api/admin/vip/benefit-definitions/${code}`))
}

// Round 18 — Cosmetic items
export async function adminListCosmeticItems(type) {
  return unwrap(await api.get('/api/admin/vip/items', { params: type ? { type } : {} }))
}
export async function adminCreateCosmeticItem(body) {
  return unwrap(await api.post('/api/admin/vip/items', body))
}
export async function adminUpdateCosmeticItem(id, body) {
  return unwrap(await api.patch(`/api/admin/vip/items/${id}`, body))
}
export async function adminDeleteCosmeticItem(id) {
  return unwrap(await api.delete(`/api/admin/vip/items/${id}`))
}

/** Upload ảnh cho cosmetic item. Return { url: "/uploads/cosmetics/xxx.png" } */
export async function uploadCosmeticImage(file) {
  const fd = new FormData()
  fd.append('file', file)
  return unwrap(await api.post('/api/admin/vip/items/upload-image', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }))
}
