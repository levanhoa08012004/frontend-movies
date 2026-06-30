import api from './api'
import { unwrap } from '../utils/apiResponse'

/**
 * Round 19 — Admin trigger LLM rebuild llm_profile cho 1 user.
 * Spring gate ADMIN role, forward sang Python /api/admin/recsys/profile/rebuild
 * (~30-60s vì có LLM call).
 */
export async function rebuildUserProfile(userId, { force = true } = {}) {
  const res = await api.post('/api/admin/recsys/profile/rebuild', null, {
    params: { userId, force },
    timeout: 120000,
  })
  return unwrap(res)
}
