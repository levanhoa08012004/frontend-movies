import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import MovieCard from '../components/MovieCard.jsx'
import * as movieApi from '../services/movieApi'
import { posterSrc } from '../utils/posterUrl'
import { useAuth } from '../context/useAuth.js'

function posterHero(path) {
  const p = posterSrc(path)
  if (!p) return null
  return p.includes('image.tmdb.org') ? p.replace('/w500/', '/w1280/') : p
}

function truncate(s, n = 200) {
  if (!s) return ''
  const t = s.trim()
  return t.length <= n ? t : `${t.slice(0, n).trim()}…`
}

/** Cuộn ngang có nút và snap — phong cách app xem phim */
function PosterRail({
  title,
  tag,
  subtitle,
  toAll = '/explore',
  loading,
  skeletonCount = 12,
  children,
  cardWidth = 'w-[152px]',
}) {
  const scroller = useRef(null)
  const scrollBy = (dir) => {
    const el = scroller.current
    if (!el) return
    const step = Math.min(el.clientWidth * 0.85, 520)
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }

  return (
    <section className="mt-12 sm:mt-16">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3 px-1">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {tag ? (
              <span className="rounded border border-brand-coral/35 bg-brand-coral/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-coral">
                {tag}
              </span>
            ) : null}
            <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white sm:text-xl md:text-2xl">
              {title}
            </h2>
          </div>
          {subtitle ? <p className="mt-1.5 text-sm text-zinc-500">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Cuộn trái"
            onClick={() => scrollBy(-1)}
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-200 transition hover:border-brand-coral/40 hover:bg-brand-coral/10 sm:flex"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Cuộn phải"
            onClick={() => scrollBy(1)}
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-200 transition hover:border-brand-coral/40 hover:bg-brand-coral/10 sm:flex"
          >
            ›
          </button>
          <Link
            to={toAll}
            className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:border-brand-coral/35 hover:text-white"
          >
            Xem tất cả
          </Link>
        </div>
      </div>
      <div
        ref={scroller}
        className="flex gap-3 overflow-x-auto pb-2 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-4 [&::-webkit-scrollbar]:hidden"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {loading
          ? [...Array(skeletonCount)].map((_, i) => (
              <div
                key={`sk-${i}`}
                className={`${cardWidth} flex-shrink-0 animate-pulse rounded-xl bg-zinc-800/80 md:rounded-2xl`}
                style={{ aspectRatio: '2/3', scrollSnapAlign: 'start' }}
              />
            ))
          : children}
      </div>
    </section>
  )
}

function HeroSpotlight({ movies, loading, welcome }) {
  const [i, setI] = useState(0)
  const list = (movies || []).slice(0, 6)
  const current = list[i] || null

  useEffect(() => {
    setI((prev) => (list.length ? Math.min(prev, list.length - 1) : 0))
  }, [list.length])

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
                idx === i ? 'w-6 bg-brand-coral' : 'w-1.5 bg-white/35 hover:bg-white/55'
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

const PILL_NAV = [
  { to: '/explore', label: 'Khám phá' },
  { to: '/search', label: 'Tìm phim' },
  { to: '/charts', label: 'Bảng xếp hạng' },
  { to: '/watchlist', label: 'Danh sách của tôi' },
]

export default function Dashboard() {
  const { user, refreshUser } = useAuth()
  const [trending, setTrending] = useState([])
  const [released, setReleased] = useState([])
  const [topWeek, setTopWeek] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const welcome = user?.name?.trim() ? user.name : user?.username || user?.email || 'bạn'

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const [t, n, w] = await Promise.all([
        movieApi.trending({ size: 16, page: 0 }),
        movieApi.newReleases({ size: 20, page: 0 }),
        movieApi.topWeek({ size: 16, page: 0 }),
      ])
      setTrending(t.content || [])
      setReleased(n.content || [])
      setTopWeek(w.content || [])
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Không tải được danh sách phim.')
      setTrending([])
      setReleased([])
      setTopWeek([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    document.title = 'Trang chủ — VieStream'
    load().catch(() => {})
    refreshUser().catch(() => {})
  }, [load, refreshUser])

  return (
    <div className="relative pb-28">
      {/* Nền tổng thể */}
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[620px] bg-[radial-gradient(ellipse_100%_80%_at_50%_-20%,rgba(225,29,72,0.13),transparent_55%),radial-gradient(ellipse_80%_60%_at_100%_0%,rgba(244,63,94,0.06),transparent)]" />
      <div className="pointer-events-none fixed inset-0 -z-20 bg-brand-ink" />

      <div className="mx-auto max-w-[1600px] px-3 sm:px-6 lg:px-10">
        {/* Thanh lối tắt */}
        <div className="py-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {PILL_NAV.map((p) => (
              <Link
                key={p.to}
                to={p.to}
                className="rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:border-brand-coral/35 hover:bg-brand-coral/10 hover:text-white sm:text-sm"
              >
                {p.label}
              </Link>
            ))}
            <Link
              to="/vip"
              className="ml-auto rounded-full border border-amber-500/30 bg-gradient-to-r from-amber-500/15 to-amber-600/10 px-4 py-2 text-xs font-bold text-brand-gold sm:text-sm"
            >
              ★ Gói VIP
            </Link>
          </div>
        </div>

        <HeroSpotlight movies={trending} loading={loading} welcome={welcome} />

        {error ? (
          <p className="mt-8 rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-center text-sm text-red-300">
            {error}
          </p>
        ) : null}

        {/* Nội dung chính — nhiều hàng */}
        <PosterRail
          title="Thịnh hành"
          tag="Hot"
          subtitle="Được xem và quan tâm nhiều trong thời gian gần đây"
          toAll="/charts"
          loading={loading && !trending.length}
          cardWidth="w-[148px]"
        >
          {!loading || trending.length
            ? trending.map((m) => (
                <div
                  key={m.id}
                  className="flex-shrink-0 scroll-m-4"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <MovieCard movie={m} widthClass="w-[148px] md:w-[168px]" showTitleBelow />
                </div>
              ))
            : null}
        </PosterRail>

        <PosterRail
          title="Đề xuất tuần này"
          tag="Top 10"
          subtitle="Xếp hạng theo lượt xem tuần"
          toAll="/charts"
          loading={loading && !topWeek.length}
          cardWidth="w-[148px]"
        >
          {!loading || topWeek.length
            ? topWeek.map((m) => (
                <div key={m.id} className="flex-shrink-0" style={{ scrollSnapAlign: 'start' }}>
                  <MovieCard movie={m} widthClass="w-[148px] md:w-[168px]" showTitleBelow />
                </div>
              ))
            : null}
        </PosterRail>

        <PosterRail
          title="Mới cập nhật"
          tag="Mới nhất"
          subtitle="Phim và tập mới được thêm gần đây"
          toAll="/explore"
          loading={loading && !released.length}
          cardWidth="w-[148px]"
        >
          {!loading || released.length
            ? released.map((m) => (
                <div key={m.id} className="flex-shrink-0" style={{ scrollSnapAlign: 'start' }}>
                  <MovieCard movie={m} widthClass="w-[148px] md:w-[168px]" showTitleBelow />
                </div>
              ))
            : null}
        </PosterRail>

        {/* Khu đăng ký — giống block cuối trang dịch vụ */}
        <section className="mt-16 overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-brand-panel via-brand-ink to-zinc-950 p-8 md:rounded-3xl md:p-12">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <h3 className="font-display text-2xl font-bold text-white md:text-3xl">Giải trí không giới hạn</h3>
            <p className="mt-3 text-sm text-zinc-500 md:text-[15px]">
              VIP xem không quảng cáo (theo gói), chất lượng cao hơn và ưu tiên phim độc quyền — trải nghiệm tương tự các dịch vụ phim online hàng đầu.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/vip"
                className="rounded-xl bg-brand-coral px-8 py-3 text-sm font-bold text-white shadow-lg shadow-brand-coral/20"
              >
                Nâng cấp VIP
              </Link>
              <Link
                to="/"
                className="rounded-xl border border-white/15 px-8 py-3 text-sm font-semibold text-zinc-200 hover:bg-white/5"
              >
                Tìm phim bằng AI
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
