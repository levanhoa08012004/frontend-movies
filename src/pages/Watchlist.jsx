import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MovieCard from '../components/MovieCard.jsx'
import * as userActivityApi from '../services/userActivityApi'
import { useBenefit } from '../context/useVipBenefits.js'

export default function Watchlist() {
  const [pg, setPg] = useState({ content: [], totalPages: 0, totalElements: 0 })
  const [page, setPage] = useState(0)
  const watchlistLimit = useBenefit('WATCHLIST_LIMIT', 10)
  const isUnlimited = Number(watchlistLimit) < 0

  const load = useCallback(async () => {
    const data = await userActivityApi.watchlist({ page, size: 20 })
    setPg({
      content: data.content || [],
      totalPages: data.totalPages ?? 1,
      totalElements: data.totalElements ?? (data.content || []).length,
    })
  }, [page])

  useEffect(() => {
    document.title = 'Xem sau — VieStream'
    load().catch(() => {})
  }, [load])

  const total = pg.totalElements ?? 0
  const isAtLimit = !isUnlimited && total >= Number(watchlistLimit)

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-neutral-950 to-zinc-950 pb-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(244,63,94,0.14),transparent)]"
      />
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-coral">Của bạn</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">Danh sách xem sau</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Phim bạn đã thêm vào xem sau — bấm xoá để gỡ khỏi danh sách.
            </p>
          </div>
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              isAtLimit
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                : 'border-white/10 bg-white/[0.04] text-zinc-300'
            }`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Sức chứa</p>
            <p className="mt-0.5 font-mono text-base font-bold">
              {total} / {isUnlimited ? '∞' : watchlistLimit}
            </p>
          </div>
        </div>

        {isAtLimit ? (
          <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] px-5 py-4 text-sm text-amber-200">
            ⚠ Danh sách đã đầy ({watchlistLimit} phim). Xoá bớt phim cũ hoặc{' '}
            <Link to="/vip" className="font-semibold underline">
              nâng cấp VIP
            </Link>{' '}
            để mở khoá không giới hạn.
          </div>
        ) : null}

        {pg.content.length === 0 ? (
          <p className="mt-12 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-8 text-center text-sm text-zinc-500">
            Chưa có phim nào trong danh sách xem sau.
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {pg.content.map((m) => (
              <div key={m.id} className="flex flex-col gap-2">
                <MovieCard movie={m} widthClass="w-full" showTitleBelow />
                <button
                  type="button"
                  className="text-xs font-medium text-zinc-500 transition hover:text-red-400"
                  onClick={async () => {
                    await userActivityApi.removeWatchlist(m.id)
                    await load().catch(() => {})
                  }}
                >
                  Gỡ khỏi danh sách
                </button>
              </div>
            ))}
          </div>
        )}

        {pg.totalPages > 1 ? (
          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              type="button"
              disabled={page <= 0}
              className="rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-zinc-300 transition hover:border-brand-coral/50 disabled:opacity-30"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              ← Trước
            </button>
            <span className="text-sm tabular-nums text-zinc-500">
              {page + 1} / {pg.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= pg.totalPages - 1}
              className="rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-zinc-300 transition hover:border-brand-coral/50 disabled:opacity-30"
              onClick={() => setPage((p) => p + 1)}
            >
              Sau →
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
