import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import * as userActivityApi from '../services/userActivityApi'

const ACTION_LABEL = {
  watch: 'Đã xem',
  rate: 'Đã đánh giá',
  like: 'Thích',
  dislike: 'Không thích',
  click: 'Nhấp',
  impression: 'Hiển thị',
  dismiss: 'Bỏ qua',
}

function fmtWhen(iso) {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return String(iso)
  }
}

function actionBadgeClass(action) {
  const a = (action || '').toLowerCase()
  if (a === 'watch') return 'bg-brand-coral/15 text-brand-coral ring-1 ring-brand-coral/30'
  if (a === 'rate') return 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25'
  if (a === 'like') return 'bg-emerald-500/12 text-emerald-300 ring-1 ring-emerald-500/20'
  return 'bg-zinc-500/12 text-zinc-300 ring-1 ring-white/10'
}

export default function History() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.title = 'Lịch sử — VieStream'
    userActivityApi
      .history({ page: 0, size: 50 })
      .then((d) => setRows(d.content || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false))
  }, [])

  const summary = useMemo(() => {
    const n = rows.length
    const watchN = rows.filter((r) => (r.action || '').toLowerCase() === 'watch').length
    return { n, watchN }
  }, [rows])

  return (
    <div className="relative mx-auto max-w-3xl px-5 pb-24 pt-8 sm:px-8 lg:pb-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_80%_55%_at_50%_-15%,rgba(244,63,94,0.11),transparent)]" />

      <header className="relative mb-10 border-b border-white/10 pb-8">
        <p className="font-display text-xs font-bold uppercase tracking-[0.28em] text-brand-coral/90">Tài khoản</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-white md:text-[2.5rem]">Lịch sử tương tác</h1>
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-zinc-500">
          Các hành vi như xem phim được hệ thống ghi nhận tự động khi bạn mở trang chi tiết hoặc tập phim — không cần thao tác thêm.
        </p>
        {!loading && summary.n > 0 ? (
          <p className="mt-4 text-sm text-zinc-400">
            <span className="font-semibold text-zinc-200">{summary.n}</span> mục gần đây
            {summary.watchN > 0 ? (
              <>
                {' '}
                · <span className="text-brand-coral">{summary.watchN}</span> lượt xem
              </>
            ) : null}
          </p>
        ) : null}
      </header>

      {loading ? (
        <div className="space-y-4 py-8">
          {[1, 2, 3, 4].map((k) => (
            <div
              key={k}
              className="animate-pulse rounded-2xl border border-white/[0.06] bg-brand-panel p-6"
            >
              <div className="h-5 w-28 rounded bg-zinc-800" />
              <div className="mt-4 h-4 w-3/4 rounded bg-zinc-800/70" />
              <div className="mt-2 h-3 w-40 rounded bg-zinc-800/50" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="relative rounded-3xl border border-dashed border-white/12 bg-black/25 px-8 py-20 text-center">
          <p className="font-display text-xl text-zinc-400">Chưa có hoạt động</p>
          <p className="mt-2 text-sm text-zinc-600">Khi bạn xem phim hoặc tương tác, lịch sử sẽ hiện tại đây.</p>
          <Link
            to="/explore"
            className="mt-8 inline-flex rounded-full border border-brand-coral/35 bg-brand-coral/10 px-6 py-2.5 text-sm font-semibold text-brand-coral transition hover:bg-brand-coral/20"
          >
            Khám phá phim
          </Link>
        </div>
      ) : (
        <ul className="relative space-y-4">
          {rows.map((r) => {
            const act = (r.action || '').toLowerCase()
            const label = ACTION_LABEL[act] || r.action || 'Hoạt động'
            return (
              <li
                key={r.id}
                className="group rounded-2xl border border-white/[0.08] bg-brand-panel/90 p-6 shadow-lg shadow-black/20 transition hover:border-white/12"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
                    <span
                      className={`inline-flex shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${actionBadgeClass(act)}`}
                    >
                      {label}
                    </span>
                    {r.movieId ? (
                      <Link
                        to={`/movies/${r.movieId}`}
                        className="min-w-0 truncate font-display text-lg font-semibold text-white underline-offset-2 hover:text-brand-coral hover:underline"
                      >
                        {r.movieTitle || `Phim #${r.movieId}`}
                      </Link>
                    ) : (
                      <span className="font-display text-lg font-semibold text-zinc-200">
                        {r.movieTitle || '—'}
                      </span>
                    )}
                  </div>
                  <time className="shrink-0 text-xs text-zinc-500" dateTime={r.createdAt}>
                    {fmtWhen(r.createdAt)}
                  </time>
                </div>
                {r.rating != null ? (
                  <p className="mt-3 text-sm text-zinc-400">
                    Đánh giá: <span className="font-semibold text-amber-200/90">★ {r.rating}</span>
                  </p>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
