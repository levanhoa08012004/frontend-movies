import { Link } from 'react-router-dom'
import { posterSrc } from '../utils/posterUrl'
import { cleanMovieTitle } from '../utils/movieTitle.js'

function isVipOnly(movie) {
  const t = movie?.vipMinTier
  return t && String(t).toUpperCase() !== 'NONE'
}

export default function MovieCard({
  movie,
  widthClass = 'w-[140px] md:w-[172px]',
  showTitleBelow = false,
  to,
}) {
  const p = posterSrc(movie.posterPath)
  // to=null → render KHÔNG Link (dùng khi parent đã bọc <Link> riêng, vd
  // recommendation card cần URL có via=catalog hints — tránh nested anchor).
  // to=undefined (mặc định) → tự link sang /movies/<id>.
  const target = to === undefined ? `/movies/${movie.id}` : to
  const cardClass = `group relative block ${widthClass} flex-shrink-0 overflow-hidden rounded-xl border border-white/10 bg-zinc-900/90 shadow-xl shadow-black/50 ring-1 ring-white/[0.06] transition hover:-translate-y-1 hover:border-brand-coral/40 hover:ring-brand-coral/20 md:rounded-2xl`
  const body = (
    <>
      {p ? (
        <img
          src={p}
          alt={cleanMovieTitle(movie.title)}
          loading="lazy"
          decoding="async"
          className="aspect-[2/3] w-full object-cover transition duration-500 group-hover:scale-[1.04] group-hover:opacity-100"
          style={{ opacity: 0.92 }}
        />
      ) : (
        <div className="flex aspect-[2/3] w-full flex-col justify-end bg-gradient-to-br from-zinc-900 via-neutral-950 to-black p-3">
          <p className="line-clamp-3 text-xs font-semibold text-zinc-300">{cleanMovieTitle(movie.title)}</p>
        </div>
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/90 via-black/35 to-transparent opacity-95" />
      {movie.kind === 'SERIES' ? (
        <span className="absolute left-2.5 top-2.5 rounded-md border border-brand-coral/35 bg-black/65 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-coral backdrop-blur">
          Phim bộ
        </span>
      ) : movie.kind ? (
        <span className="absolute left-2.5 top-2.5 rounded-md border border-white/20 bg-black/60 px-2 py-0.5 text-[10px] font-medium text-zinc-200 backdrop-blur">
          Phim lẻ
        </span>
      ) : null}
      {isVipOnly(movie) ? (
        <span className="absolute right-2 top-2 rounded-md border border-amber-500/35 bg-black/75 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-gold backdrop-blur">
          VIP
        </span>
      ) : null}
    </>
  )
  const card = target
    ? <Link to={target} className={cardClass}>{body}</Link>
    : <div className={cardClass}>{body}</div>

  if (!showTitleBelow) return card

  return (
    <div className={`flex-shrink-0 ${widthClass}`}>
      {card}
      <p className="mt-2 line-clamp-2 text-left text-xs font-medium leading-snug text-zinc-300">{cleanMovieTitle(movie.title)}</p>
    </div>
  )
}
