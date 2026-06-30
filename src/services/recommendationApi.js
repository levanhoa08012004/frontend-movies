import api from './api'
import { unwrap } from '../utils/apiResponse'

// Round 19 — Endpoint chính đổi tên thành /api/vip/recommendations (VIP-only).
// Spring controller gate tier trước khi forward sang Python /api/vip/recommendations
// (alias của /recommendations/v2). 403 VIP_REQUIRED nếu user chưa nâng cấp.
// Các hàm dưới giữ tên cũ — internal route về endpoint mới.

async function callV2(body) {
  const res = await api.post('/api/vip/recommendations', body ?? {})
  return unwrap(res)
}

export async function recommend(body) {
  return callV2(body)
}

export async function recommendGenerative(body) {
  return callV2(body)
}

export async function recommendPersonalized() {
  // v2 yêu cầu query — cá nhân hoá "thuần profile" gửi query rỗng-trá-hình
  // ("phim hay") để pipeline chạy + áp profile blend.
  return callV2({ query: 'phim hay', top_k: 10 })
}

export async function conversationalSearch(body) {
  const data = await callV2(body)
  // AiSearchCard chờ shape { query, reasoning, recommendations }; v2 trả
  // { recommendations, user_id, trace? } → bổ sung field tương thích.
  return {
    query: body?.query ?? '',
    reasoning: '',
    suggested_refinements: [],
    ...data,
  }
}
