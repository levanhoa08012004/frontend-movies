/**
 * Round 17 — Sanitize raw movie titles from imported catalogs.
 *
 * Ophim / TMDB metadata thường bị concat thành title raw kiểu:
 *   "EP01_ Daughter of Fortune - - China - TV - Romance - Traditional Costume - Deng Xiaoci, Zheng Qiuhong"
 *   "Movie Name (2024) | 1080p | Vietsub"
 *   "Tap 12 - Phim XYZ"
 *
 * Hàm clean lọc các prefix/suffix metadata không cần thiết để hiển thị thân thiện.
 * KHÔNG sửa data DB — chỉ format cho UI.
 */

const EP_PREFIX_RE = /^(?:ep|tap|tập|episode|集)\s*\d+\s*[_\-:.]?\s*/i
const META_TAIL_TOKENS = new Set([
  // country names
  'china', 'korea', 'south korea', 'japan', 'usa', 'us', 'uk', 'vietnam', 'thailand', 'india', 'taiwan', 'hongkong',
  // medium
  'tv', 'movie', 'film', 'series', 'oav', 'ova', 'special',
  // common quality tags
  '1080p', '720p', '480p', '4k', 'fhd', 'hd', 'sd', 'cam', 'webrip', 'bluray', 'hdrip',
  // sub/dub
  'vietsub', 'thuyết minh', 'thuyet minh', 'lồng tiếng', 'long tieng', 'dub', 'sub', 'raw',
])

function isMetaToken(s) {
  if (!s) return true
  const t = s.trim().toLowerCase()
  if (!t) return true
  if (META_TAIL_TOKENS.has(t)) return true
  // Quality patterns "1080p", "4k"
  if (/^\d{3,4}p$/.test(t)) return true
  if (/^(19|20)\d{2}$/.test(t)) return false // năm phát hành — giữ
  return false
}

/**
 * Clean a raw movie title for friendly display.
 * @param {string} raw
 * @returns {string}
 */
export function cleanMovieTitle(raw) {
  if (!raw) return ''
  let s = String(raw).trim()

  // Strip leading "EP01_ " / "Tập 1 - " / etc.
  s = s.replace(EP_PREFIX_RE, '')

  // Normalize " - - " (empty meta cell) → single separator
  s = s.replace(/\s*-\s*-\s*/g, ' - ')

  // Split by " - " or " | " and drop trailing metadata tokens
  const parts = s.split(/\s+[-|]\s+/).map((p) => p.trim()).filter(Boolean)
  if (parts.length > 1) {
    // Keep building until we hit metadata
    const keep = []
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]
      // Once we hit a meta token, stop (everything after is likely cast/tags)
      if (isMetaToken(p)) break
      keep.push(p)
      // Title is usually 1-2 segments; bail after 2 to avoid stitching cast
      if (keep.length >= 2) break
    }
    s = keep.length ? keep.join(' - ') : parts[0]
  }

  // Drop trailing parenthetical metadata "(1080p)" but keep "(2024)" (year)
  s = s.replace(/\s*\(([^)]+)\)\s*$/, (m, inner) => {
    if (/^(19|20)\d{2}$/.test(inner.trim())) return ` (${inner.trim()})`
    return ''
  })

  // Collapse whitespace
  s = s.replace(/\s+/g, ' ').trim()

  return s || raw
}
