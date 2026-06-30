import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AiSearchCard from '../components/AiSearchCard.jsx'
import HeroSpotlight from '../components/HeroSpotlight.jsx'
import MovieCard from '../components/MovieCard.jsx'
import PosterRail from '../components/PosterRail.jsx'
import { useAuth } from '../context/useAuth.js'
import * as movieApi from '../services/movieApi'

const PILL_NAV = [
  { to: '/explore', label: 'Khám phá' },
  { to: '/search', label: 'Tìm phim' },
  { to: '/charts', label: 'Bảng xếp hạng' },
  { to: '/watchlist', label: 'Danh sách của tôi' },
]

const RAIL_DEFS = [
  { key: 'trending', tag: 'Hot', title: 'Thịnh hành', subtitle: 'Được xem và quan tâm nhiều gần đây', toAll: '/charts',
    fetch: () => movieApi.trending({ size: 16, page: 0 }) },
  { key: 'topWeek', tag: 'Top 10', title: 'Đề xuất tuần này', subtitle: 'Xếp hạng theo lượt xem tuần', toAll: '/charts',
    fetch: () => movieApi.topWeek({ size: 16, page: 0 }) },
  { key: 'newReleases', tag: 'Mới nhất', title: 'Mới cập nhật', subtitle: 'Phim và tập mới được thêm gần đây', toAll: '/explore',
    fetch: () => movieApi.newReleases({ size: 20, page: 0 }) },
  { key: 'korean', tag: 'Quốc gia', title: 'Phim Hàn Quốc', subtitle: 'K-drama và bom tấn xứ Hàn', toAll: '/explore?country=Hàn Quốc',
    fetch: () => movieApi.byCountry('Hàn Quốc', { size: 16 }) },
  { key: 'japanese', tag: 'Quốc gia', title: 'Phim Nhật Bản', subtitle: 'Anime, J-drama và phim chiếu rạp', toAll: '/explore?country=Nhật Bản',
    fetch: () => movieApi.byCountry('Nhật Bản', { size: 16 }) },
  { key: 'us', tag: 'Quốc gia', title: 'Phim Âu Mỹ', subtitle: 'Hollywood, châu Âu và series quốc tế', toAll: '/explore?country=Âu Mỹ',
    fetch: () => movieApi.byCountry('Âu Mỹ', { size: 16 }) },
  { key: 'chinese', tag: 'Quốc gia', title: 'Phim Trung Quốc', subtitle: 'C-drama và phim cổ trang Hoa ngữ', toAll: '/explore?country=Trung Quốc',
    fetch: () => movieApi.byCountry('Trung Quốc', { size: 16 }) },
  { key: 'vietnam', tag: 'Quốc gia', title: 'Phim Việt Nam', subtitle: 'Phim Việt mới nhất', toAll: '/explore?country=Việt Nam',
    fetch: () => movieApi.byCountry('Việt Nam', { size: 16 }) },
  { key: 'action', tag: 'Thể loại', title: 'Hành động', subtitle: 'Bom tấn và phim hành động kịch tính', toAll: '/explore?genre=Hành Động',
    fetch: () => movieApi.byGenre('Hành Động', { size: 16 }) },
  { key: 'romance', tag: 'Thể loại', title: 'Tình cảm', subtitle: 'Phim tình cảm và rom-com', toAll: '/explore?genre=Tình Cảm',
    fetch: () => movieApi.byGenre('Tình Cảm', { size: 16 }) },
  { key: 'period', tag: 'Thể loại', title: 'Cổ trang', subtitle: 'Phim cổ trang Á đông', toAll: '/explore?genre=Cổ Trang',
    fetch: () => movieApi.byGenre('Cổ Trang', { size: 16 }) },
]

export default function HomeShell() {
  const { user } = useAuth()
  const [rails, setRails] = useState(() =>
    RAIL_DEFS.reduce((acc, d) => ({ ...acc, [d.key]: [] }), {}),
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const welcome = user?.name?.trim()
    ? user.name
    : user?.username || user?.email || 'bạn'

  const load = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      const results = await Promise.allSettled(RAIL_DEFS.map((d) => d.fetch()))
      const next = {}
      results.forEach((r, idx) => {
        const key = RAIL_DEFS[idx].key
        next[key] = r.status === 'fulfilled' ? r.value.content || [] : []
      })
      setRails(next)
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Không tải được danh sách phim.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    document.title = 'Trang chủ — VieStream'
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data-fetching effect; pattern reused across codebase
    load().catch(() => {})
  }, [load])

  return (
    <div className="relative pb-28">
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

        {/* Hero ảnh trending */}
        <HeroSpotlight movies={rails.trending} loading={loading} welcome={welcome} />

        {/* AI search compact */}
        <AiSearchCard />

        {error ? (
          <p className="mt-8 rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-center text-sm text-red-300">
            {error}
          </p>
        ) : null}

        {/* Các hàng PosterRail */}
        {RAIL_DEFS.map((def) => {
          const items = rails[def.key] || []
          return (
            <PosterRail
              key={def.key}
              tag={def.tag}
              title={def.title}
              subtitle={def.subtitle}
              toAll={def.toAll}
              loading={loading && !items.length}
              cardWidth="w-[148px]"
            >
              {!loading || items.length
                ? items.map((m) => (
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
          )
        })}

        {/* CTA VIP */}
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
                to="/explore"
                className="rounded-xl border border-white/15 px-8 py-3 text-sm font-semibold text-zinc-200 hover:bg-white/5"
              >
                Khám phá kho phim
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
