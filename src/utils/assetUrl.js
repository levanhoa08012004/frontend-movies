const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'

/**
 * Resolve URL ảnh do server trả về:
 * - Trống → null
 * - Bắt đầu bằng http(s) hoặc data: → trả nguyên (Google avatar, data URL)
 * - Bắt đầu bằng `/` → prepend API base (vd `/uploads/avatars/foo.jpg`)
 */
export function assetUrl(path) {
  if (!path) return null
  const s = String(path)
  if (/^(https?:|data:)/i.test(s)) return s
  if (s.startsWith('/')) return `${API_BASE}${s}`
  return s
}
