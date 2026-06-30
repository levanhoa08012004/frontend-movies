import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import * as movieApi from '../services/movieApi'
import * as userActivityApi from '../services/userActivityApi'
import { copyToClipboard, streamSuggestedName } from '../utils/download.js'
import { posterSrc } from '../utils/posterUrl'
import { assetUrl } from '../utils/assetUrl.js'
import { useAuth } from '../context/useAuth.js'
import { useBenefit } from '../context/useVipBenefits.js'
import { useUserCosmetics } from '../context/useUserCosmetics.js'
import AvatarFrame from '../components/cosmetics/AvatarFrame.jsx'
import EpisodePicker from '../components/EpisodePicker.jsx'
import Modal from '../components/Modal.jsx'
import { cleanMovieTitle } from '../utils/movieTitle.js'

function toTrailerEmbed(url) {
  if (!url) return ''
  const yt = String(url).match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([\w-]{11})/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0&modestbranding=1`
  return url
}

function isYouTubeUrl(url) {
  return !!url && /(?:youtube\.com|youtu\.be)/.test(String(url))
}

function formatCommentTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const diffMs = Date.now() - d.getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'Vừa xong'
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} ngày trước`
  return d.toLocaleDateString('vi-VN')
}

function CommentItem({ comment, currentUser, star, onDelete, onSave }) {
  const isOwner = currentUser && String(currentUser.id) === String(comment.userId)
  const cosmetics = useUserCosmetics(comment.userId)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(comment.content || '')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const menuRef = useRef(null)

  const avatarFrameItem = cosmetics?.avatar_frame
  const commentFrame = cosmetics?.comment_frame?.cssClass || ''
  const nameEffect = cosmetics?.name_effect?.cssClass || ''
  const nameBadge = cosmetics?.name_badge?.badgeHtml || ''
  const chatColor = cosmetics?.chat_color?.cssClass || ''

  useEffect(() => {
    if (!menuOpen) return undefined
    function onDoc(ev) {
      if (menuRef.current && !menuRef.current.contains(ev.target)) setMenuOpen(false)
    }
    function onKey(ev) {
      if (ev.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  function startEdit() {
    setDraft(comment.content || '')
    setErr('')
    setEditing(true)
    setMenuOpen(false)
  }

  function cancelEdit() {
    if (busy) return
    setEditing(false)
    setDraft(comment.content || '')
    setErr('')
  }

  async function submitEdit(ev) {
    ev.preventDefault()
    const text = draft.trim()
    if (!text) {
      setErr('Nội dung không được trống.')
      return
    }
    if (text === (comment.content || '').trim()) {
      setEditing(false)
      return
    }
    setBusy(true)
    setErr('')
    try {
      await onSave(comment.id, text)
      setEditing(false)
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || 'Không lưu được.')
    } finally {
      setBusy(false)
    }
  }

  const avatarUrl = assetUrl(comment.authorAvatar)
  const initials = (comment.authorName || '?').trim().slice(0, 2).toUpperCase()
  const edited = comment.updatedAt && comment.createdAt && comment.updatedAt !== comment.createdAt

  return (
    <div className={`relative flex gap-3 rounded-2xl border border-white/10 bg-zinc-900/60 p-4 ${menuOpen ? 'z-30' : ''} ${commentFrame}`}>
      <AvatarFrame frame={avatarFrameItem} size={40} className="shrink-0">
        {avatarUrl ? (
          <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full place-items-center text-sm font-bold text-brand-coral">{initials}</span>
        )}
      </AvatarFrame>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className={`text-sm font-semibold text-zinc-200 ${nameEffect}`}>
                {comment.authorName}
              </p>
              {nameBadge && <span className="text-sm">{nameBadge}</span>}
              {star ? (
                <span className="text-sm text-amber-400" title={`${star}/5`}>
                  {'★'.repeat(star)}<span className="text-zinc-700">{'★'.repeat(5 - star)}</span>
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-xs text-zinc-600">
              {formatCommentTime(comment.createdAt)}
              {edited ? <span className="ml-1">· đã chỉnh sửa</span> : null}
            </p>
          </div>

          {isOwner && !editing ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                aria-label="Tuỳ chọn bình luận"
                onClick={() => setMenuOpen((v) => !v)}
                className="grid size-8 place-items-center rounded-full text-zinc-500 transition hover:bg-white/10 hover:text-white"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
                  <circle cx="5" cy="12" r="1.8" />
                  <circle cx="12" cy="12" r="1.8" />
                  <circle cx="19" cy="12" r="1.8" />
                </svg>
              </button>
              {menuOpen ? (
                <div className="absolute right-0 top-9 z-50 w-40 overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-xl shadow-black/60">
                  <button
                    type="button"
                    onClick={startEdit}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-zinc-200 transition hover:bg-white/5"
                  >
                    Sửa bình luận
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onDelete(comment.id) }}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-300 transition hover:bg-red-500/10"
                  >
                    Xoá bình luận
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        {editing ? (
          <form onSubmit={submitEdit} className="mt-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              autoFocus
              className="w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500/40 focus:outline-none"
            />
            {err ? (
              <p className="mt-2 rounded-lg border border-red-500/40 bg-red-950/60 px-3 py-2 text-xs text-red-200">{err}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={cancelEdit}
                disabled={busy}
                className="rounded-lg border border-white/15 px-4 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-white/5 disabled:opacity-50"
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-brand-coral px-4 py-1.5 text-xs font-bold text-white transition hover:bg-brand-accent disabled:opacity-50"
              >
                {busy ? 'Đang lưu…' : 'Lưu'}
              </button>
            </div>
          </form>
        ) : (
          <p className={`mt-2 text-sm leading-relaxed text-zinc-300 ${chatColor}`}>{comment.content}</p>
        )}
      </div>
    </div>
  )
}

function StarRating({ value, onChange, size = 'text-3xl' }) {
  const [hover, setHover] = useState(0)
  const display = hover || value
  return (
    <div
      className="flex items-center gap-1"
      onMouseLeave={() => setHover(0)}
      role="radiogroup"
      aria-label="Chọn số sao"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} sao`}
          onMouseEnter={() => setHover(n)}
          onFocus={() => setHover(n)}
          onClick={() => onChange(n)}
          className={`${size} leading-none transition ${
            n <= display ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]' : 'text-zinc-700'
          } hover:scale-110`}
        >
          ★
        </button>
      ))}
      {value ? (
        <span className="ml-3 text-sm font-semibold text-zinc-300">{value}/5</span>
      ) : (
        <span className="ml-3 text-sm text-zinc-500">Chưa chọn</span>
      )}
    </div>
  )
}

export default function MovieDetail() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const via = searchParams.get('via') || undefined
  const slug = searchParams.get('slug') || undefined
  const tmdb = searchParams.get('tmdb') || undefined
  const kind = searchParams.get('kind') || undefined
  const navigate = useNavigate()
  const movieId = Number(id)
  const { user, isGuest } = useAuth()
  const offlineQuota = useBenefit('OFFLINE_QUOTA_MONTHLY', 0)
  const canDownload = Number(offlineQuota) !== 0
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [comment, setComment] = useState('')
  const [ratingsPg, setRatingsPg] = useState({ content: [], totalPages: 0, totalElements: 0 })
  const [commentsPg, setCommentsPg] = useState({ content: [], totalPages: 0 })
  const [cpage, setCpage] = useState(0)
  const [msg, setMsg] = useState('')
  const [copyToast, setCopyToast] = useState('')

  // Review popup
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewStar, setReviewStar] = useState(0)
  const [reviewText, setReviewText] = useState('')
  const [reviewBusy, setReviewBusy] = useState(false)
  const [reviewErr, setReviewErr] = useState('')

  // Trailer popup
  const [trailerOpen, setTrailerOpen] = useState(false)

  // Map userId → star để hiển thị sao cạnh tên trong bình luận
  const ratingByUser = useMemo(() => {
    const m = new Map()
    for (const r of ratingsPg.content || []) {
      if (r.userId != null) m.set(String(r.userId), r.star)
    }
    return m
  }, [ratingsPg.content])

  // Điểm trung bình tính từ user thực trên app (không dùng voteAverage từ TMDB).
  // Khi chưa ai đánh giá → mặc định 5.0. Có người đánh giá → tính trung bình.
  const userRatingSummary = useMemo(() => {
    const items = ratingsPg.content || []
    const count = ratingsPg.totalElements ?? items.length
    if (!items.length) return { avg: 5, count: 0, rated: false }
    const sum = items.reduce((s, r) => s + (Number(r.star) || 0), 0)
    return { avg: sum / items.length, count, rated: true }
  }, [ratingsPg.content, ratingsPg.totalElements])

  const isSeries = useMemo(() => movie?.kind === 'SERIES', [movie])

  const loadMovie = useCallback(async () => {
    setLoading(true)
    setErr('')
    try {
      const data = await movieApi.getMovie(movieId, true, { via, slug, tmdb, kind })
      setMovie(data)
      document.title = `${cleanMovieTitle(data.title)} — VieStream`
      // Khi vào bằng catalog_id/hints (từ recommendation), Spring waterfall resolve
      // sang Movie thật với PK khác. Rewrite URL sang /movies/<PK> để mọi call con
      // (rate/comment/watchlist/episodes) tự nhiên dùng PK, không phải tra lại.
      if (data?.id != null && Number(data.id) !== movieId) {
        navigate(`/movies/${data.id}`, { replace: true })
      }
    } catch (e) {
      setErr(e.response?.data?.message || 'Không tìm thấy phim.')
    } finally {
      setLoading(false)
    }
  }, [movieId, via, slug, tmdb, kind, navigate])

  async function reloadRatings(p) {
    const d = await movieApi.listRatings(movieId, { page: p, size: 10 })
    setRatingsPg({
      content: d.content || [],
      totalPages: d.totalPages ?? 1,
      totalElements: d.totalElements ?? (d.content?.length || 0),
    })
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

  function openReview() {
    if (!user) {
      setMsg('Vui lòng đăng nhập để đánh giá.')
      return
    }
    setReviewStar(ratingByUser.get(String(user.id)) || 0)
    setReviewText('')
    setReviewErr('')
    setReviewOpen(true)
  }

  function closeReview() {
    if (reviewBusy) return
    setReviewOpen(false)
  }

  async function onSubmitReview(ev) {
    ev.preventDefault()
    if (!reviewStar) {
      setReviewErr('Vui lòng chọn số sao.')
      return
    }
    setReviewErr('')
    setReviewBusy(true)
    try {
      await movieApi.rateMovie(movieId, Number(reviewStar))
      const text = reviewText.trim()
      if (text) {
        await movieApi.addComment(movieId, text, undefined)
      }
      await Promise.allSettled([reloadRatings(0), reloadComments(0)])
      setReviewOpen(false)
      setMsg(text ? 'Cảm ơn bạn — đánh giá và bình luận đã được đăng.' : 'Cảm ơn bạn đã đánh giá!')
    } catch (e) {
      setReviewErr(e?.response?.data?.message || e?.message || 'Không gửi được đánh giá.')
    } finally {
      setReviewBusy(false)
    }
  }

  async function onComment(ev) {
    ev.preventDefault()
    if (!comment.trim()) return
    try {
      await movieApi.addComment(movieId, comment.trim(), undefined)
      setComment('')
      reloadComments(0).catch(() => {})
    } catch (e) {
      setMsg(e.response?.data?.message || e.message)
    }
  }

  async function onUpdateComment(cid, content) {
    await movieApi.updateComment(cid, content)
    await reloadComments(cpage).catch(() => {})
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
          className="mt-6 rounded-full border border-white/20 px-6 py-2 text-sm text-brand-coral hover:border-brand-coral/50"
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
        <>
          <div
            className="pointer-events-none absolute inset-0 opacity-55"
            style={{
              backgroundImage: `linear-gradient(to bottom,rgba(0,0,0,0.2),rgba(0,0,0,0.98)), url(${p})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
              filter: 'blur(40px)',
              transform: 'scale(1.06)',
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] bg-gradient-to-b from-transparent via-black/40 to-black/95"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(244,63,94,0.16),transparent)]"
          />
        </>
      ) : null}

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-8">
        <Link
          to="/dashboard"
          className="inline-flex text-sm font-medium text-zinc-500 transition hover:text-brand-coral"
        >
          ← Trang chủ
        </Link>

        <div className="mt-8 grid gap-12 lg:grid-cols-[min(260px,34%)_minmax(0,1fr)] lg:gap-14">
          <div className="mx-auto w-full max-w-[280px]">
            <div className="overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/70 ring-1 ring-white/5">
              {p ? (
                <img src={p} alt={cleanMovieTitle(movie.title)} className="aspect-[2/3] w-full object-cover" />
              ) : (
                <div className="flex aspect-[2/3] items-center justify-center bg-zinc-900 text-xs text-zinc-600">
                  Chưa có poster
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-coral/90">
              {movie.kind === 'SERIES' ? (
                <span className="rounded-full border border-brand-coral/35 bg-brand-coral/10 px-3 py-1">
                  Phim bộ
                </span>
              ) : (
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-zinc-400">
                  Phim lẻ
                </span>
              )}
              {movie.vipMinTier && movie.vipMinTier !== 'NONE' ? (
                <span className="rounded-full border border-amber-500/35 bg-amber-500/10 px-3 py-1 text-amber-300">
                  ★ {movie.vipMinTier}
                </span>
              ) : null}
            </div>
            <h1 className="font-display mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {cleanMovieTitle(movie.title)}
            </h1>
            {movie.originName && movie.originName.trim() && cleanMovieTitle(movie.title) !== movie.originName.trim() ? (
              <p className="mt-1 text-sm text-zinc-500">{movie.originName.trim()}</p>
            ) : null}

            {/* Meta pill row — gộp tất cả thông tin ngắn (năm/rating/thời lượng/quốc gia/số tập) */}
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-zinc-400">
              {movie.releaseYear ? (
                <span className="rounded-lg bg-white/5 px-2 py-1">{movie.releaseYear}</span>
              ) : null}
              <span
                className="rounded-lg bg-white/5 px-2 py-1"
                title={userRatingSummary.rated
                  ? `${userRatingSummary.count} người đã đánh giá`
                  : 'Chưa có đánh giá — hiển thị mặc định 5 sao'}
              >
                <span className="text-amber-400">★</span>{' '}
                {userRatingSummary.avg.toFixed(1)}
                {userRatingSummary.rated ? (
                  <span className="ml-1 text-xs text-zinc-500">({userRatingSummary.count})</span>
                ) : null}
              </span>
              {movie.duration ? (
                <span className="rounded-lg bg-white/5 px-2 py-1">
                  {(() => {
                    const sec = Number(movie.duration)
                    if (!sec) return '—'
                    // Catalog đôi khi lưu phút thay vì giây (≤ 1000 = đã là phút)
                    const minutes = sec < 1000 ? sec : Math.round(sec / 60)
                    return `${minutes} phút`
                  })()}
                </span>
              ) : null}
              {movie.country ? (
                <span className="rounded-lg bg-white/5 px-2 py-1">{movie.country}</span>
              ) : null}
              {movie.totalEpisodes != null && isSeries ? (
                <span className="rounded-lg bg-white/5 px-2 py-1">{movie.totalEpisodes} tập</span>
              ) : null}
            </div>
            {movie.genres ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {String(movie.genres).split(/[,|;]/).map((g) => g.trim()).filter(Boolean).slice(0, 8).map((g) => (
                  <span key={g} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-zinc-300">
                    {g}
                  </span>
                ))}
              </div>
            ) : null}

            <p className="mt-6 whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-300/95">
              {movie.overview || 'Chưa có mô tả.'}
            </p>

            {/* Director + Cast — inline rows, không box */}
            {(movie.director || movie.cast) ? (
              <div className="mt-6 space-y-2 text-sm">
                {movie.director ? (
                  <p className="text-zinc-300">
                    <span className="mr-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Đạo diễn</span>
                    <span className="text-zinc-200">{movie.director}</span>
                  </p>
                ) : null}
                {movie.cast ? (
                  <p className="text-zinc-300">
                    <span className="mr-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Diễn viên</span>
                    <span className="leading-relaxed text-zinc-200">{movie.cast}</span>
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="mt-10 flex flex-wrap gap-3">
              {isGuest ? (
                <Link
                  to="/login"
                  state={{ from: { pathname: `/movies/${movieId}` } }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-brand-coral px-7 py-3.5 text-sm font-bold tracking-wide text-white shadow-xl shadow-brand-coral/30 hover:bg-brand-accent"
                  title="Đăng nhập để xem phim"
                >
                  <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7L8 5z" />
                  </svg>
                  Đăng nhập để xem
                </Link>
              ) : isSeries && movie.episodes?.length ? (
                <Link
                  to={`/movies/${movieId}/episodes/${movie.episodes[0].episodeNumber}${movie.episodes[0].serverName ? `?serverName=${encodeURIComponent(movie.episodes[0].serverName)}` : ''}`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-brand-coral px-7 py-3.5 text-sm font-bold tracking-wide text-white shadow-xl shadow-brand-coral/30 hover:bg-brand-accent"
                >
                  <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7L8 5z" />
                  </svg>
                  Xem tập 1
                </Link>
              ) : isSeries ? (
                <span className="rounded-2xl border border-white/15 px-6 py-3.5 text-sm text-zinc-500">
                  Chưa có tập nào
                </span>
              ) : playUrl ? (
                <>
                  <Link
                    to={`/movies/${movieId}/xem`}
                    className="inline-flex items-center gap-2 rounded-2xl bg-brand-coral px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-brand-coral/30 hover:bg-brand-accent"
                  >
                    <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7L8 5z" />
                    </svg>
                    Xem ngay
                  </Link>
                  {canDownload ? (
                    <a
                      href={playUrl}
                      download={streamSuggestedName(movieId, playUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/5 px-5 py-3.5 text-sm font-semibold text-white hover:border-brand-coral/40 hover:bg-white/10"
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
                  ) : (
                    <Link
                      to="/vip"
                      title="Tải offline là đặc quyền VIP. Nâng cấp để mở khoá."
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3.5 text-sm font-semibold text-zinc-500 transition hover:border-brand-coral/30 hover:text-brand-coral"
                    >
                      <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path d="M12 11V7a4 4 0 118 0v4M6 11h12a2 2 0 012 2v7a2 2 0 01-2 2H6a2 2 0 01-2-2v-7a2 2 0 012-2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Tải xuống (VIP)
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => copyLink(playUrl)}
                    className="rounded-2xl border border-white/15 px-5 py-3.5 text-sm font-medium text-zinc-200 hover:border-brand-coral/35"
                  >
                    Sao chép liên kết
                  </button>
                </>
              ) : null}

              {movie.trailerUrl ? (
                <button
                  type="button"
                  onClick={() => setTrailerOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-5 py-3.5 text-sm font-semibold text-zinc-200 transition hover:border-brand-coral/40 hover:bg-white/5"
                >
                  <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7L8 5z" />
                  </svg>
                  Xem trailer
                </button>
              ) : null}

              <button
                type="button"
                onClick={async () => {
                  if (isGuest) {
                    setMsg('Bạn cần đăng nhập để thêm phim vào danh sách xem sau.')
                    return
                  }
                  try {
                    await userActivityApi.addWatchlist(movieId)
                    setMsg('Đã thêm vào danh sách xem sau.')
                  } catch (e) {
                    const code = e.response?.data?.code
                    if (code === 1046) {
                      // WATCHLIST_FULL — gói thường giới hạn 10. Prompt nâng cấp VIP.
                      setMsg('⚠ Danh sách xem sau đã đầy (10 phim). Xoá bớt hoặc nâng cấp VIP để không giới hạn.')
                    } else {
                      setMsg(e.response?.data?.message || e.message)
                    }
                  }
                }}
                className="rounded-2xl border border-white/15 px-6 py-3.5 text-sm font-semibold text-zinc-200 hover:border-white/35 hover:bg-white/5"
              >
                + Danh sách của tôi
              </button>

              <button
                type="button"
                onClick={openReview}
                className="inline-flex items-center gap-2 rounded-2xl border border-amber-500/35 bg-amber-500/10 px-6 py-3.5 text-sm font-semibold text-amber-200 transition hover:border-amber-500/55 hover:bg-amber-500/15"
              >
                <span className="text-amber-400">★</span>
                Đánh giá
              </button>
            </div>

            {copyToast ? (
              <p className="mt-4 text-sm text-brand-coral/90">{copyToast}</p>
            ) : null}
          </div>
        </div>

        {isSeries ? (
          <EpisodePicker
            movieId={movieId}
            posterPath={movie.posterPath}
            episodes={movie.episodes || []}
          />
        ) : null}

        <section className="mt-24 border-t border-white/10 pt-16">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold text-white">Bình luận</h2>
            <button
              type="button"
              onClick={openReview}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/15"
            >
              <span className="text-amber-400">★</span>
              Viết đánh giá
            </button>
          </div>

          <form onSubmit={onComment} className="mt-6 space-y-3">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              placeholder="Chia sẻ cảm nhận của bạn…"
              className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-brand-coral/40 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-brand-coral px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-accent"
            >
              Đăng bình luận
            </button>
          </form>

          <div className="mt-8 space-y-3">
            {commentsPg.content.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-5 py-6 text-center text-sm text-zinc-500">
                Chưa có bình luận nào — bạn là người đầu tiên!
              </p>
            ) : null}
            {commentsPg.content.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                currentUser={user}
                star={ratingByUser.get(String(c.userId))}
                onDelete={onDeleteComment}
                onSave={onUpdateComment}
              />
            ))}
          </div>

          {commentsPg.totalPages > 1 ? (
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                className="text-sm text-brand-coral disabled:opacity-35"
                disabled={cpage <= 0}
                onClick={() => reloadComments(cpage - 1)}
              >
                ←
              </button>
              <button
                type="button"
                className="text-sm text-brand-coral disabled:opacity-35"
                disabled={cpage >= commentsPg.totalPages - 1}
                onClick={() => reloadComments(cpage + 1)}
              >
                →
              </button>
            </div>
          ) : null}
        </section>

        {msg ? (
          <p className="mt-10 rounded-2xl border border-amber-500/25 bg-amber-950/25 px-5 py-3 text-sm text-amber-100">
            {msg}
          </p>
        ) : null}
      </div>

      <Modal
        isOpen={trailerOpen}
        onClose={() => setTrailerOpen(false)}
        title={`Trailer — ${cleanMovieTitle(movie.title)}`}
        widthClass="max-w-3xl"
      >
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
          {isYouTubeUrl(movie.trailerUrl) ? (
            <iframe
              src={toTrailerEmbed(movie.trailerUrl)}
              title="Trailer"
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            <video
              src={movie.trailerUrl}
              controls
              autoPlay
              className="h-full w-full"
            />
          )}
        </div>
      </Modal>

      <Modal isOpen={reviewOpen} onClose={closeReview} title="Đánh giá phim" widthClass="max-w-lg">
        <form onSubmit={onSubmitReview} className="space-y-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">Chọn số sao</p>
            <p className="mt-1 text-sm text-zinc-400">Di chuột qua các sao rồi nhấn để chọn.</p>
            <div className="mt-3">
              <StarRating value={reviewStar} onChange={setReviewStar} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500">
              Bình luận (tuỳ chọn)
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              placeholder="Chia sẻ cảm nhận của bạn về phim này…"
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500/40 focus:outline-none"
            />
            <p className="mt-1 text-xs text-zinc-600">Bình luận sẽ hiển thị trong mục Bình luận bên dưới.</p>
          </div>

          {reviewErr ? (
            <p className="rounded-lg border border-red-500/40 bg-red-950/60 px-3 py-2 text-sm text-red-200">{reviewErr}</p>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/[0.06] pt-4">
            <button
              type="button"
              onClick={closeReview}
              disabled={reviewBusy}
              className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-white/5 disabled:opacity-50"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={reviewBusy || !reviewStar}
              className="rounded-xl bg-amber-500 px-7 py-2.5 text-sm font-bold text-black shadow-lg shadow-amber-500/25 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {reviewBusy ? 'Đang gửi…' : 'Gửi đánh giá'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
