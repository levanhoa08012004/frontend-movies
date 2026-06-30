import api from './api'
import { unwrap } from '../utils/apiResponse'

export async function vipPlans() {
  const res = await api.get('/api/payment/vip/plans')
  return unwrap(res)
}

/** @param tier 'VIP' | 'VIPPRO' | 'PRIME' — query enum backend */
export async function createVnPayPayment(tier) {
  const res = await api.get('/api/payment/vnpay/create', { params: { tier } })
  return unwrap(res)
}

/**
 * Bảng so sánh động cho trang /vip.
 * Trả { tiers: [...], definitions: [...], matrix: { tierCode: { benefitCode: value } } }
 */
export async function vipBenefitsMatrix() {
  const res = await api.get('/api/payment/vip/benefits-matrix')
  return unwrap(res)
}
