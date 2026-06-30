import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import * as userActivityApi from '../services/userActivityApi'
import { posterSrc } from '../utils/posterUrl'

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

/**
 * Format thời lượng xem: 95 → "1 giờ 35 phút", 23 → "23 phút", 45 → "45 giây".
 * Player gửi giây (watch_duration_sec). Hiển thị làm tròn xuống đơn vị lớn nhất.
 */
function fmtDuration(sec) {
  if (sec == null) return null
  const s = Number(sec)
  if (!Number.isFinite(s) || s <= 0) return null
  if (s < 60) return `${Math.round(s)} giây`
  const minutes = Math.round(s / 60)
  if (minutes < 60) return `${minutes} phút`
  const hours = Math.floor(minutes / 60)
  const remMin = minutes % 60
  return remMin ? `${hours} giờ ${remMin} phút` : `${hours} giờ`
}

function actionBadgeClass(action) {
  const a = (action || '').toLowerCase()
  if (a === 'watch') return 'bg-brand-coral/15 text-brand-coral ring-1 ring-brand-coral/30'
  if (a === 'rate') return 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/25'
  if (a === 'like') return 'bg-sky-500/12 text-sky-300 ring-1 ring-sky-500/20'
  return 'bg-zinc-500/12 text-zinc-300 ring-1 ring-white/10'
}

/**
 * Card 1 hành vi — Netflix Continue-Watching style.
 * Poster bên trái 80×112, info bên phải. Khi action=watch và phim SERIES,
 * hiển thị badge "Tập n/N" và thanh tiến độ nếu có watchDurationSec.
 */
function HistoryRow({ r }) {
  const act = (r.action || '').toLowerCase()
  const label = ACTION_LABEL[act] || r.action || 'Hoạt động'
  const isSeries = r.movieKind === 'SERIES'
  const isWatch = act === 'watch'
  const epLabel = isSeries && r.episodeNumber
    ? r.totalEpisodes
      ? `Tập ${r.episodeNumber}/${r.totalEpisodes}`
      : `Tập ${r.episodeNumber}`
    : null
  const durationLabel = fmtDuration(r.watchDurationSec)
  const poster = posterSrc(r.posterPath)
  // Link đi sâu vào tập đang xem nếu có episodeNumber + SERIES; ngược lại về trang phim.
  const target = isSeries && r.episodeNumber
    ? `/movies/${r.movieId}/episodes/${r.episodeNumber}`
    : r.movieId
      ? `/movies/${r.movieId}`
      : null

  return (
    <li className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-brand-panel/90 shadow-lg shadow-black/20 transition hover:border-white/15">
      <div className="flex gap-4 p-4 sm:gap-5 sm:p-5">
        {/* Poster — 80×112 aspect 2:3 */}
        <Link
          to={target || '#'}
          className="relative block h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-zinc-900 ring-1 ring-white/[0.06] sm:h-32 sm:w-[5.75rem]"
          onClick={(e) => {
            if (!target) e.preventDefault()
          }}
        >
          {poster ? (
            <img
              src={poster}
              alt={r.movieTitle || ''}
              loading="lazy"
              className="h-full w-full object-cover transition group-hover:scale-[1.04]"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-wider text-zinc-600">
              No poster
            </div>
          )}
          {/* Badge "▶" khi action=watch — overlay góc dưới phải. */}
          {isWatch ? (
            <span className="absolute bottom-1 right-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-coral/90 text-[10px] text-white shadow">
              ▶
            </span>
          ) : null}
        </Link>

        {/* Info */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <span
                className={`inline-flex shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${actionBadgeClass(act)}`}
              >
                {label}
              </span>
              {epLabel ? (
                <span className="inline-flex shrink-0 rounded-lg bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold text-sky-200 ring-1 ring-sky-500/25">
                  {epLabel}
                </span>
              ) : null}
              {isSeries && !epLabel ? (
                <span className="inline-flex shrink-0 rounded-lg bg-zinc-500/12 px-2 py-0.5 text-[10px] font-semibold text-zinc-300 ring-1 ring-white/10">
                  Phim bộ
                </span>
              ) : null}
              {!isSeries && r.movieKind === 'SINGLE' ? (
                <span className="inline-flex shrink-0 rounded-lg bg-zinc-500/12 px-2 py-0.5 text-[10px] font-semibold text-zinc-300 ring-1 ring-white/10">
                  Phim lẻ
                </span>
              ) : null}
            </div>
            <time className="shrink-0 text-[11px] text-zinc-500" dateTime={r.createdAt}>
              {fmtWhen(r.createdAt)}
            </time>
          </div>

          {target ? (
            <Link
              to={target}
              className="mt-2 line-clamp-2 font-display text-base font-semibold text-white underline-offset-2 hover:text-brand-coral hover:underline sm:text-lg"
            >
              {r.movieTitle || `Phim #${r.movieId}`}
            </Link>
          ) : (
            <span className="mt-2 line-clamp-2 font-display text-base font-semibold text-zinc-200 sm:text-lg">
              {r.movieTitle || '—'}
            </span>
          )}

          {/* Metric rows: thời lượng xem + đánh giá */}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-zinc-400">
            {durationLabel ? (
              <span className="inline-flex items-center gap-1.5">
                <svg className="h-3.5 w-3.5 text-brand-coral/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Đã xem <span className="font-semibold text-zinc-200">{durationLabel}</span>
              </span>
            ) : null}
            {r.rating != null ? (
              <span className="inline-flex items-center gap-1">
                <span className="text-amber-300">★</span>
                <span className="font-semibold text-amber-200/90">{r.rating}/5</span>
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  )
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
    // Tổng phút xem trong batch — chỉ tính action watch có duration.
    const totalSec = rows.reduce((acc, r) => {
      const a = (r.action || '').toLowerCase()
      if (a !== 'watch') return acc
      const s = Number(r.watchDurationSec)
      return Number.isFinite(s) && s > 0 ? acc + s : acc
    }, 0)
    return { n, watchN, totalMin: Math.round(totalSec / 60) }
  }, [rows])

  return (
    <div className="relative mx-auto max-w-3xl px-5 pb-24 pt-8 sm:px-8 lg:pb-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_80%_55%_at_50%_-15%,rgba(244,63,94,0.11),transparent)]" />

      <header className="relative mb-10 border-b border-white/10 pb-8">
        <p className="font-display text-xs font-bold uppercase tracking-[0.28em] text-brand-coral/90">Tài khoản</p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-white md:text-[2.5rem]">Lịch sử tương tác</h1>

        {!loading && summary.n > 0 ? (
          <p className="mt-4 text-sm text-zinc-400">
            <span className="font-semibold text-zinc-200">{summary.n}</span> mục gần đây
            {summary.watchN > 0 ? (
              <>
                {' '}
                · <span className="text-brand-coral">{summary.watchN}</span> lượt xem
              </>
            ) : null}
            {summary.totalMin > 0 ? (
              <>
                {' '}
                · tổng{' '}
                <span className="font-semibold text-zinc-200">
                  {fmtDuration(summary.totalMin * 60)}
                </span>
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
              className="flex animate-pulse gap-4 rounded-2xl border border-white/[0.06] bg-brand-panel p-5"
            >
              <div className="h-28 w-20 shrink-0 rounded-xl bg-zinc-800" />
              <div className="flex flex-1 flex-col">
                <div className="h-4 w-24 rounded bg-zinc-800" />
                <div className="mt-3 h-5 w-3/4 rounded bg-zinc-800/70" />
                <div className="mt-3 h-3 w-32 rounded bg-zinc-800/50" />
              </div>
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
        <ul className="relative space-y-3">
          {rows.map((r) => (
            <HistoryRow key={r.id} r={r} />
          ))}
        </ul>
      )}
    </div>
  )
}
