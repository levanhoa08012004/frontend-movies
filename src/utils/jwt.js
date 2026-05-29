/**
 * Giải mã JWT (payload) chỉ để đọc claim cục bộ — không dùng để xác thực server.
 */
export function decodeJwtPayload(token) {
  if (!token || typeof token !== 'string') return null
  try {
    const [, payloadB64] = token.split('.')
    if (!payloadB64) return null
    const padded = payloadB64.replace(/-/g, '+').replace(/_/g, '/')
    const json =
      padded.length % 4 === 0
        ? atob(padded)
        : atob(padded + '='.repeat(4 - (padded.length % 4)))
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function jwtUserId(token) {
  const p = decodeJwtPayload(token)
  if (!p || p.userId === undefined || p.userId === null) return null
  return String(p.userId)
}
