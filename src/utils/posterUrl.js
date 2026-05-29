export function posterSrc(posterPath) {
  if (!posterPath) return null
  if (posterPath.startsWith('http')) return posterPath
  const p = posterPath.startsWith('/') ? posterPath : `/${posterPath}`
  return `https://image.tmdb.org/t/p/w500${p}`
}
