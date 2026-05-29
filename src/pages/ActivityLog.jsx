import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BEHAVIOR_ACTIONS } from '../constants/backend'
import * as userActivityApi from '../services/userActivityApi'

export default function ActivityLog() {
  const [movieId, setMovieId] = useState('')
  const [action, setAction] = useState('watch')
  const [rating, setRating] = useState('')
  const [watchSec, setWatchSec] = useState('')
  const [fdbMovie, setFdbMovie] = useState('')
  const [fdbAction, setFdbAction] = useState('impression')
  const [msg, setMsg] = useState('')

  async function sendBehavior(ev) {
    ev.preventDefault()
    setMsg('')
    try {
      await userActivityApi.postBehavior({
        movieId: Number(movieId),
        action,
        rating: rating === '' ? undefined : Number(rating),
        watchDurationSec: watchSec === '' ? undefined : Number(watchSec),
      })
      setMsg('Đã gửi nhật ký hành vi.')
    } catch (e) {
      setMsg(e.response?.data?.message || e.message)
    }
  }

  async function sendFeedback(ev) {
    ev.preventDefault()
    setMsg('')
    try {
      await userActivityApi.postFeedback({
        movieId: Number(fdbMovie),
        action: fdbAction,
      })
      setMsg('Đã gửi phản hồi.')
    } catch (e) {
      setMsg(e.response?.data?.message || e.message)
    }
  }

  const field =
    'vie-input-dark vie-autofill-fix w-full rounded-xl border border-white/12 bg-brand-panel px-4 py-3 text-base text-zinc-100 outline-none'

  return (
    <div className="relative mx-auto max-w-3xl px-5 pb-24 pt-8 sm:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_70%_50%_at_30%_-10%,rgba(251,191,36,0.08),transparent)]" />

      <div className="relative mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/quan-tri"
            className="text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-brand-coral"
          >
            ← Bảng quản trị
          </Link>
          <h1 className="mt-3 font-display text-3xl font-bold text-white md:text-4xl">Công cụ gửi hành vi</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
            Trang dành cho quản trị viên khi cần thử API. Người dùng thường <strong className="font-semibold text-zinc-400">không dùng</strong> trang
            này — hành vi <span className="text-brand-coral">xem phim</span> đã được ghi tự động khi mở trang chi tiết hoặc tập phim.
          </p>
        </div>
      </div>

      <form onSubmit={sendBehavior} className="relative space-y-4 rounded-2xl border border-white/10 bg-brand-panel/80 p-6 shadow-xl shadow-black/30">
        <h2 className="font-display text-lg font-bold text-white">Gửi nhật ký hành vi</h2>
        <input placeholder="movieId" required value={movieId} onChange={(e) => setMovieId(e.target.value)} className={field} />
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className={`${field} capitalize`}
        >
          {BEHAVIOR_ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <input placeholder="rating (tuỳ chọn)" value={rating} onChange={(e) => setRating(e.target.value)} className={field} />
        <input
          placeholder="watchDurationSec (tuỳ chọn)"
          value={watchSec}
          onChange={(e) => setWatchSec(e.target.value)}
          className={field}
        />
        <button
          type="submit"
          className="rounded-xl bg-brand-coral px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-coral/25 hover:bg-rose-500"
        >
          Gửi behavior
        </button>
      </form>

      <form
        onSubmit={sendFeedback}
        className="relative mt-8 space-y-4 rounded-2xl border border-white/10 bg-brand-panel/80 p-6 shadow-xl shadow-black/30"
      >
        <h2 className="font-display text-lg font-bold text-white">Gửi phản hồi nội dung</h2>
        <input placeholder="movieId" required value={fdbMovie} onChange={(e) => setFdbMovie(e.target.value)} className={field} />
        <select value={fdbAction} onChange={(e) => setFdbAction(e.target.value)} className={`${field} capitalize`}>
          {['impression', 'click', 'dismiss'].map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl bg-brand-coral px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-coral/25 hover:bg-rose-500"
        >
          Gửi feedback
        </button>
      </form>

      {msg ? (
        <p className="relative mt-8 rounded-2xl border border-amber-500/35 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">{msg}</p>
      ) : null}
    </div>
  )
}
