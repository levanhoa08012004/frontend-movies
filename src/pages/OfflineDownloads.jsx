import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as offlineApi from '../services/offlineApi'

const field = 'vie-input-dark vie-autofill-fix'

export default function OfflineDownloads() {
  const [quota, setQuota] = useState(null)
  const [list, setList] = useState([])
  const [movieId, setMovieId] = useState('')
  const [episodeId, setEpisodeId] = useState('')
  const [msg, setMsg] = useState('')

  async function refresh() {
    const [q, pg] = await Promise.all([
      offlineApi.offlineQuota(),
      offlineApi.listOfflineDownloads({ page: 0, size: 30 }),
    ])
    setQuota(q)
    setList(pg.content || [])
  }

  useEffect(() => {
    document.title = 'Công cụ offline — VieStream'
    refresh().catch(() => {})
  }, [])

  async function record(ev) {
    ev.preventDefault()
    setMsg('')
    try {
      const body = {
        movieId: Number(movieId),
        episodeId: episodeId ? Number(episodeId) : undefined,
      }
      await offlineApi.recordOfflineDownload(body)
      setMsg('Đã ghi nhận lượt tải offline.')
      await refresh()
    } catch (e) {
      setMsg(e.response?.data?.message || e.message)
    }
  }

  return (
    <div className="relative mx-auto max-w-3xl px-5 pb-24 pt-8 sm:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_70%_50%_at_30%_-10%,rgba(251,191,36,0.08),transparent)]" />

      <div className="relative mb-8">
        <Link
          to="/quan-tri"
          className="text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-brand-coral"
        >
          ← Bảng quản trị
        </Link>
        <h1 className="mt-3 font-display text-3xl font-bold text-white md:text-4xl">Công cụ ghi nhận tải offline</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
          Trang dành cho <strong className="font-semibold text-zinc-400">quản trị viên</strong> khi cần thử API và xem chỉ báo.
          Người dùng thường không truy cập — menu &quot;Tải offline&quot; đã được gỡ khỏi khu vực tài khoản.
        </p>
      </div>

      {quota ? (
        <div className="rounded-2xl border border-white/10 bg-brand-panel/80 p-6 text-sm text-zinc-300 shadow-xl shadow-black/25">
          <p>
            Đã dùng tháng: <span className="font-semibold text-white">{quota.usedThisMonth}</span>
          </p>
          <p className="mt-2">
            Giới hạn: <span className="font-semibold text-white">{quota.limitPerMonth}</span>
          </p>
          <p className="mt-2">
            Còn lại:{' '}
            <span className="font-semibold text-white">
              {quota.remaining === null || quota.remaining === undefined ? '∞' : quota.remaining}
            </span>
          </p>
        </div>
      ) : null}

      <form
        onSubmit={record}
        className="relative mt-8 space-y-4 rounded-2xl border border-white/10 bg-brand-panel/80 p-6 shadow-xl shadow-black/30"
      >
        <h2 className="font-display text-lg font-bold text-white">Ghi nhận lượt tải (test)</h2>
        <input required placeholder="movieId" value={movieId} onChange={(e) => setMovieId(e.target.value)} className={field} />
        <input
          placeholder="episodeId (bắt buộc nếu SERIES)"
          value={episodeId}
          onChange={(e) => setEpisodeId(e.target.value)}
          className={field}
        />
        <button
          type="submit"
          className="rounded-xl bg-brand-coral px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-coral/25 hover:bg-rose-500"
        >
          Gửi
        </button>
      </form>

      {msg ? (
        <p className="relative mt-6 rounded-2xl border border-amber-500/35 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">{msg}</p>
      ) : null}

      <h2 className="relative mt-12 font-display text-lg font-bold text-white">Đã ghi nhận gần đây</h2>
      <ul className="relative mt-4 space-y-2 text-sm">
        {list.length === 0 ? (
          <li className="rounded-xl border border-dashed border-white/12 px-4 py-8 text-center text-zinc-500">Chưa có dữ liệu</li>
        ) : (
          list.map((row) => (
            <li key={row.id} className="rounded-xl border border-white/[0.08] bg-black/25 px-4 py-3 text-zinc-400">
              <span className="text-zinc-200">{row.movieTitle}</span> — tập {row.episodeNumber ?? '—'} — {row.createdAt}
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
