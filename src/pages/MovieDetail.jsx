import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import * as movieApi from '../services/movieApi'
import * as userActivityApi from '../services/userActivityApi'
import { copyToClipboard, streamSuggestedName } from '../utils/download.js'
import { posterSrc } from '../utils/posterUrl'
import { useAuth } from '../context/useAuth.js'

export default function MovieDetail() {
  const { id } = useParams()
  const movieId = Number(id)
  const { user } = useAuth()
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [star, setStar] = useState(5)
  const [comment, setComment] = useState('')
  const [ratingsPg, setRatingsPg] = useState({ content: [], totalPages: 0 })
  const [commentsPg, setCommentsPg] = useState({ content: [], totalPages: 0 })
  const [rpage, setRpage] = useState(0)
  const [cpage, setCpage] = useState(0)
  const [msg, setMsg] = useState('')
  const [copyToast, setCopyToast] = useState('')

  const isSeries = useMemo(() => movie?.kind === 'SERIES', [movie])

  const loadMovie = useCallback(async () => {
    setLoading(true)
    setErr('')
    try {
      const data = await movieApi.getMovie(movieId, true)
      setMovie(data)
      document.title = `${data.title} — VieStream`
    } catch (e) {
      setErr(e.response?.data?.message || 'Không tìm thấy phim.')
    } finally {
      setLoading(false)
    }
  }, [movieId])

  async function reloadRatings(p) {
    const d = await movieApi.listRatings(movieId, { page: p, size: 10 })
    setRatingsPg({ content: d.content || [], totalPages: d.totalPages ?? 1 })
    setRpage(p)
  }

  async function reloadComments(p) {
    const d = await movieApi.listComments(movieId, { page: p, size: 10 })
    setCommentsPg({ content: d.content || [], totalPages: d.totalPages ?? 1 })
    setCpage(p)
  }

  useEffect(() => {
    loadMovie().catch(() => {})
  }, [loadMovie])

  useEffect(() => {
    if (!movie) return
    reloadRatings(0).catch(() => {})
    reloadComments(0).catch(() => {})
  }, [movie, movieId])

  useEffect(() => {
    if (!movie || !user) return
    userActivityApi.postWatchBehaviorDeduped(user.id, movieId).catch(() => {})
  }, [movie?.id, user?.id, movieId])

  async function onRate(ev) {
    ev.preventDefault()
    setMsg('')
    try {
      await movieApi.rateMovie(movieId, Number(star))
      setMsg('Cảm ơn bạn đã đánh giá!')
      reloadRatings(0).catch(() => {})
    } catch (e) {
      setMsg(e.response?.data?.message || e.message)
    }
  }

  async function onComment(ev) {
    ev.preventDefault()
    if (!comment.trim()) return
    try {
      await movieApi.addComment(movieId, comment.trim(), undefined)
      setComment('')
      setMsg('Bình luận đã được đăng.')
      reloadComments(0).catch(() => {})
    } catch (e) {
      setMsg(e.response?.data?.message || e.message)
    }
  }

  async function onDeleteComment(cid) {
    if (!window.confirm('Xóa bình luận này?')) return
    try {
      await movieApi.deleteComment(cid)
      reloadComments(cpage).catch(() => {})
    } catch (e) {
      setMsg(e.response?.data?.message || e.message)
    }
  }

  async function copyLink(url) {
    const ok = await copyToClipboard(url)
    setCopyToast(ok ? 'Đã sao chép liên kết.' : 'Không sao chép được.')
    window.setTimeout(() => setCopyToast(''), 2200)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-zinc-950 px-4 py-20">
        <div className="mx-auto max-w-6xl animate-pulse space-y-8">
          <div className="h-10 w-2/3 max-w-md rounded bg-zinc-800" />
          <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
            <div className="aspect-[2/3] rounded-3xl bg-zinc-900" />
            <div className="space-y-4">
              <div className="h-6 w-full rounded bg-zinc-900" />
              <div className="h-6 w-5/6 rounded bg-zinc-900" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (err || !movie) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center">
        <p className="text-lg text-red-300/90">{err || 'Có lỗi xảy ra.'}</p>
        <Link
          to="/dashboard"
          className="mt-6 rounded-full border border-white/20 px-6 py-2 text-sm text-emerald-400 hover:border-emerald-500/50"
        >
          Về trang chủ
        </Link>
      </div>
    )
  }

  const p = posterSrc(movie.posterPath)
  const playUrl = movie.videoUrl || movie.link_m3u8 || movie.linkM3u8

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-neutral-950 via-black to-zinc-950 pb-24">
      {p ? (
        <div
          className="pointer-events-none absolute inset-0 opacity-35"
          style={{
            backgroundImage: `linear-gradient(to bottom,rgba(0,0,0,0.2),rgba(0,0,0,0.92)), url(${p})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            filter: 'blur(40px)',
            transform: 'scale(1.06)',
          }}
        />
      ) : null}

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-8">
        <Link
          to="/dashboard"
          className="inline-flex text-sm font-medium text-zinc-500 transition hover:text-emerald-400"
        >
          ← Trang chủ
        </Link>

        <div className="mt-8 grid gap-12 lg:grid-cols-[min(260px,34%)_minmax(0,1fr)] lg:gap-14">
          <div className="mx-auto w-full max-w-[280px]">
            <div className="overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/70 ring-1 ring-white/5">
              {p ? (
                <img src={p} alt={movie.title} className="aspect-[2/3] w-full object-cover" />
              ) : (
                <div className="flex aspect-[2/3] items-center justify-center bg-zinc-900 text-xs text-zinc-600">
                  Chưa có poster
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-500/90">
              {movie.kind === 'SERIES' ? (
                <span className="rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1">
                  Phim bộ
                </span>
              ) : (
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-zinc-400">
                  Phim lẻ
                </span>
              )}
            </div>
            <h1 className="font-display mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {movie.title}
            </h1>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-zinc-400">
              {movie.releaseYear ? (
                <span className="rounded-lg bg-white/5 px-2 py-1">{movie.releaseYear}</span>
              ) : null}
              {movie.voteAverage != null ? (
                <span className="rounded-lg bg-white/5 px-2 py-1">
                  ★ {Number(movie.voteAverage).toFixed(1)}
                </span>
              ) : null}
              {movie.totalEpisodes != null && isSeries ? (
                <span className="rounded-lg bg-white/5 px-2 py-1">{movie.totalEpisodes} tập</span>
              ) : null}
            </div>
            {movie.genres ? (
              <p className="mt-4 text-sm leading-relaxed text-emerald-200/65">{movie.genres}</p>
            ) : null}

            <p className="mt-6 whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-300/95">
              {movie.overview || 'Chưa có mô tả.'}
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              {isSeries ? (
                <Link
                  to={`/movies/${movieId}/episodes`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-7 py-3.5 text-sm font-bold tracking-wide text-black shadow-xl shadow-emerald-500/20 hover:bg-emerald-400"
                >
                  <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7L8 5z" />
                  </svg>
                  Xem phim
                </Link>
              ) : playUrl ? (
                <>
                  <a
                    href={playUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-7 py-3.5 text-sm font-bold text-black shadow-xl shadow-emerald-500/20 hover:bg-emerald-400"
                  >
                    <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7L8 5z" />
                    </svg>
                    Xem ngay
                  </a>
                  <a
                    href={playUrl}
                    download={streamSuggestedName(movieId, playUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-5 py-3.5 text-sm font-semibold text-white hover:border-emerald-500/40 hover:bg-white/10"
                  >
                    <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 11l5 5 5-5M12 5v11"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Tải xuống
                  </a>
                  <button
                    type="button"
                    onClick={() => copyLink(playUrl)}
                    className="rounded-2xl border border-white/15 px-5 py-3.5 text-sm font-medium text-zinc-200 hover:border-emerald-500/35"
                  >
                    Sao chép liên kết
                  </button>
                </>
              ) : null}

              <button
                type="button"
                onClick={async () => {
                  try {
                    await userActivityApi.addWatchlist(movieId)
                    setMsg('Đã thêm vào danh sách xem sau.')
                  } catch (e) {
                    setMsg(e.response?.data?.message || e.message)
                  }
                }}
                className="rounded-2xl border border-white/15 px-6 py-3.5 text-sm font-semibold text-zinc-200 hover:border-white/35 hover:bg-white/5"
              >
                + Danh sách của tôi
              </button>
            </div>

            {copyToast ? (
              <p className="mt-4 text-sm text-emerald-400/90">{copyToast}</p>
            ) : null}
          </div>
        </div>

        <section className="mt-24 border-t border-white/10 pt-16">
          <h2 className="font-display text-xl font-semibold text-white">Đánh giá</h2>
          <form onSubmit={onRate} className="mt-6 flex flex-wrap items-center gap-3">
            <select
              value={star}
              onChange={(e) => setStar(Number(e.target.value))}
              className="rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-sm text-white"
            >
              {[5, 4, 3, 2, 1].map((s) => (
                <option key={s} value={s}>
                  {s} sao
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
            >
              Gửi đánh giá
            </button>
          </form>
          <ul className="mt-8 space-y-3 border-t border-white/5 pt-8">
            {ratingsPg.content.map((row, i) => (
              <li
                key={row.id ?? `${row.userId}-${i}`}
                className="flex flex-wrap gap-2 text-sm text-zinc-400"
              >
                <span className="font-medium text-zinc-200">{row.userName}</span>
                <span>{row.star}★</span>
                <span className="text-zinc-600">{row.createdAt}</span>
              </li>
            ))}
          </ul>
          {ratingsPg.totalPages > 1 ? (
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                className="text-sm text-emerald-400 disabled:opacity-35"
                disabled={rpage <= 0}
                onClick={() => reloadRatings(rpage - 1)}
              >
                ←
              </button>
              <button
                type="button"
                className="text-sm text-emerald-400 disabled:opacity-35"
                disabled={rpage >= ratingsPg.totalPages - 1}
                onClick={() => reloadRatings(rpage + 1)}
              >
                →
              </button>
            </div>
          ) : null}
        </section>

        <section className="mt-20 border-t border-white/10 pt-16">
          <h2 className="font-display text-xl font-semibold text-white">Bình luận</h2>
          <form onSubmit={onComment} className="mt-6 space-y-4">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Chia sẻ cảm nhận của bạn…"
              className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600"
            />
            <button
              type="submit"
              className="rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-bold text-black hover:bg-emerald-400"
            >
              Đăng bình luận
            </button>
          </form>
          <div className="mt-10 space-y-4">
            {commentsPg.content.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur"
              >
                <p className="text-sm font-semibold text-zinc-200">{c.authorName}</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{c.content}</p>
                {user && String(user.id) === String(c.userId) ? (
                  <button
                    type="button"
                    onClick={() => onDeleteComment(c.id)}
                    className="mt-3 text-xs font-medium text-red-400/90 hover:text-red-300"
                  >
                    Xóa
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        {msg ? (
          <p className="mt-10 rounded-2xl border border-amber-500/25 bg-amber-950/25 px-5 py-3 text-sm text-amber-100">
            {msg}
          </p>
        ) : null}
      </div>
    </div>
  )
}
