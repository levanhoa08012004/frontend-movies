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
