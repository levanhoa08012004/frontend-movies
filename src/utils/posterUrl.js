// Proxy ảnh poster qua domain của mình (/img/...) để Cloudflare cache ở edge,
// thay vì tải thẳng từ host ngoài (img.ophim.live / image.tmdb.org) vốn chậm.
const IMG_PROXY = import.meta.env.VITE_API_URL || ''

export function posterSrc(posterPath) {
  if (!posterPath) return null
  let url
  if (posterPath.startsWith('http')) {
    url = posterPath
  } else {
    const p = posterPath.startsWith('/') ? posterPath : `/${posterPath}`
    url = `https://image.tmdb.org/t/p/w500${p}`
  }
  return url
    .replace(/^https?:\/\/img\.ophim\.live\//i, `${IMG_PROXY}/img/ophim/`)
    .replace(/^https?:\/\/image\.tmdb\.org\//i, `${IMG_PROXY}/img/tmdb/`)
}
