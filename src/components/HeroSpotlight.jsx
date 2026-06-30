import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { posterSrc } from '../utils/posterUrl'

function posterHero(path) {
  const p = posterSrc(path)
  if (!p) return null
  // tmdb (kể cả khi đã proxy qua /img/tmdb/) → dùng bản lớn w1280 cho hero
  return (p.includes('image.tmdb.org') || p.includes('/img/tmdb/'))
    ? p.replace('/w500/', '/w1280/') : p
}

function truncate(s, n = 200) {
  if (!s) return ''
  const t = s.trim()
  return t.length <= n ? t : `${t.slice(0, n).trim()}…`
}

export default function HeroSpotlight({ movies, loading, welcome }) {
  const [i, setI] = useState(0)
  const list = (movies || []).slice(0, 6)
  const safeI = list.length ? i % list.length : 0
  const current = list[safeI] || null

  useEffect(() => {
    if (list.length < 2) return undefined
    const t = window.setInterval(() => {
      setI((prev) => (prev + 1) % list.length)
    }, 7500)
    return () => window.clearInterval(t)
  }, [list.length])

  const bg = posterHero(current?.posterPath)

  if (loading && !current) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-brand-panel md:rounded-3xl">
        <div className="relative flex min-h-[320px] flex-col justify-end px-6 py-10 md:min-h-[400px] md:px-12 md:py-14">
          <div className="h-10 w-3/4 max-w-md animate-pulse rounded-lg bg-zinc-800/80" />
          <div className="mt-4 h-4 w-full max-w-lg animate-pulse rounded bg-zinc-800/60" />
        </div>
      </div>
    )
  }

  if (!current) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-brand-panel px-8 py-16 text-center">
        <p className="font-display text-lg text-zinc-400">Chưa có phim để hiển thị banner.</p>
        <Link to="/explore" className="mt-6 inline-flex text-brand-coral hover:underline">
          Khám phá kho phim
        </Link>
      </div>
    )
  }

  return (
    <div className="group/hero relative overflow-hidden rounded-2xl border border-white/[0.07] md:rounded-3xl">
      <div className="absolute inset-0">
        {bg ? (
          <>
            <img src={bg} alt="" className="h-full w-full object-cover object-[center_20%] transition duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-ink via-brand-ink/85 to-brand-ink/30" />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-ink via-brand-ink/70 to-transparent" />
          </>
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-zinc-900 via-brand-panel to-black" />
        )}
      </div>
      <div className="relative grid min-h-[340px] gap-8 px-5 py-10 md:min-h-[420px] md:grid-cols-[1fr_220px] md:items-end md:px-12 md:py-12 lg:grid-cols-[1fr_260px]">
        <div className="max-w-2xl animate-fade-up">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-coral/90">
            VieStream · Chào {welcome}
          </p>
          <h1 className="font-display mt-3 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            {current.title}
          </h1>
          <div className="mt-4 flex flex-wrap gap-2">
            {current.kind === 'SERIES' ? (
              <span className="rounded-md border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-zinc-200">
                Phim bộ
              </span>
            ) : (
              <span className="rounded-md border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-zinc-200">
                Phim lẻ
              </span>
            )}
            {current.releaseYear ? (
              <span className="rounded-md border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] text-zinc-400">
                {current.releaseYear}
              </span>
            ) : null}
          </div>
          <p className="mt-5 line-clamp-4 text-sm leading-relaxed text-zinc-400 md:text-[15px]">
            {truncate(current.overview, 220) || 'Khám phá nội dung độc quyền trên VieStream.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={`/movies/${current.id}`}
              className="inline-flex items-center justify-center rounded-xl bg-brand-coral px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-coral/25 transition hover:bg-rose-500"
            >
              Xem ngay
            </Link>
            <Link
              to={`/movies/${current.id}`}
              className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-white/35 hover:bg-white/10"
            >
              Chi tiết
            </Link>
            <Link
              to="/search"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 px-5 py-3.5 text-sm text-zinc-400 transition hover:text-white"
            >
              Tìm kiếm
            </Link>
          </div>
        </div>
        <div className="hidden md:block">
          <div className="relative mx-auto w-[200px] overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/60 lg:w-[240px]">
            <img
              src={posterSrc(current.posterPath) || bg}
              alt={current.title}
              className="aspect-[2/3] w-full object-cover"
            />
          </div>
        </div>
      </div>
      {list.length > 1 ? (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 md:bottom-6">
          {list.map((_, idx) => (
            <button
              key={`dot-${idx}`}
              type="button"
              aria-label={`Banner ${idx + 1}`}
              onClick={() => setI(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === safeI ? 'w-6 bg-brand-coral' : 'w-1.5 bg-white/35 hover:bg-white/55'
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
