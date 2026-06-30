import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Hls from 'hls.js'
import { useAuth } from '../context/useAuth.js'
import { useBenefit } from '../context/useVipBenefits.js'
import * as movieApi from '../services/movieApi'
import * as userActivityApi from '../services/userActivityApi'
import { posterSrc } from '../utils/posterUrl'

/**
 * Player nội bộ cho phim LẺ (kind=SINGLE).
 *
 * Trước đây nút "Xem ngay" trong MovieDetail mở thẳng `movie.videoUrl` (.m3u8)
 * trong tab mới → browser hiển thị trang download / VLC built-in plain. User
 * yêu cầu mở trong player VieStream giống trang tập của phim bộ.
 *
 * Tái sử dụng pattern HLS.js + VIP benefit (quality cap, playback speed,
 * download offline) từ EpisodeDetail.jsx, bỏ logic episode list / autoplay-next
 * / server switcher (phim lẻ chỉ có 1 source).
 */
export default function WatchSingle() {
  const { user } = useAuth()
  const { id } = useParams()
  const mid = Number(id)

  const [movie, setMovie] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  const maxHeight = useBenefit('MAX_VIDEO_HEIGHT', 720)
  const canChangeSpeed = useBenefit('PLAYBACK_SPEED_UNLOCKED', true)
  const offlineQuota = useBenefit('OFFLINE_QUOTA_MONTHLY', 0)
  const canDownload = Number(offlineQuota) !== 0

  const videoRef = useRef(null)
  const hlsRef = useRef(null)
  const [speed, setSpeed] = useState(1)
  const [availableHeights, setAvailableHeights] = useState([])
  const [selectedHeight, setSelectedHeight] = useState(null)

  const QUALITY_LADDER = useMemo(
    () => [
      { h: 480, label: '480p' },
      { h: 720, label: '720p HD' },
      { h: 1080, label: '1080p Full HD' },
      { h: 1440, label: '2K' },
      { h: 2160, label: '4K' },
    ],
    []
  )
  const allowedLadder = useMemo(
    () => QUALITY_LADDER.filter((q) => q.h <= (maxHeight || 720)),
    [QUALITY_LADDER, maxHeight]
  )

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      setErr('')
      try {
        const data = await movieApi.getMovie(mid, true)
        if (!alive) return
        setMovie(data)
        document.title = `${data.title || 'Xem phim'} — VieStream`
      } catch (e) {
        if (alive) setErr(e.response?.data?.message || e.message || 'Không thể tải phim.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [mid])

  const streamUrl = movie?.videoUrl || movie?.link_m3u8 || movie?.linkM3u8 || ''

  // R57+ — chỉ log "watch" khi user thực sự PLAY (bấm ▶), không phải mở trang.
  const playLoggedRef = useRef(false)
  const playStartedAtRef = useRef(null)
  useEffect(() => {
    playLoggedRef.current = false
    playStartedAtRef.current = null
  }, [mid])

  useEffect(() => {
    if (!user || !movie || err || !streamUrl) return
    const video = videoRef.current
    if (!video) return
    // Chỉ đánh dấu đã play để unmount-duration biết có gửi hay không.
    // KHÔNG post `watch` ở đây để tránh trùng row.
    function onPlay() {
      if (playStartedAtRef.current == null) {
        playStartedAtRef.current = Date.now()
      }
      playLoggedRef.current = true
    }
    video.addEventListener('play', onPlay)
    return () => video.removeEventListener('play', onPlay)
  }, [mid, err, user?.id, movie?.id, streamUrl])

  // Duration update trên unmount — chỉ khi đã PLAY và ≥5s.
  useEffect(() => {
    if (!user || !movie || !streamUrl) return
    return () => {
      if (!playLoggedRef.current) return
      const vid = videoRef.current
      let sec = 0
      if (vid && Number.isFinite(vid.currentTime) && vid.currentTime > 0) {
        sec = Math.round(vid.currentTime)
      } else if (playStartedAtRef.current) {
        sec = Math.round((Date.now() - playStartedAtRef.current) / 1000)
      }
      if (sec < 5) return
      userActivityApi.postWatchDuration(mid, sec, null).catch(() => {})
    }
  }, [mid, user?.id, movie?.id, streamUrl])

  // Khởi tạo HLS player + quality cap theo tier
  useEffect(() => {
    if (!streamUrl || !videoRef.current) return
    const video = videoRef.current
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }
    setAvailableHeights([])
    setSelectedHeight(null)
    if (Hls.isSupported()) {
      const hls = new Hls()
      hls.loadSource(streamUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const levels = hls.levels || []
        if (levels.length && maxHeight) {
          let lastAllowed = -1
          for (let i = 0; i < levels.length; i++) {
            if (levels[i].height <= maxHeight) lastAllowed = i
          }
          hls.autoLevelCapping = lastAllowed >= 0 ? lastAllowed : -1
        }
        const heights = Array.from(new Set(levels.map((l) => l.height))).sort((a, b) => a - b)
        setAvailableHeights(heights)
      })
      hlsRef.current = hls
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl
    } else {
      video.src = streamUrl
    }
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy()
        hlsRef.current = null
      }
    }
  }, [streamUrl, maxHeight])

  const pickQuality = useCallback(
    (h) => {
      const hls = hlsRef.current
      if (!hls) {
        setToast('Trình duyệt này không hỗ trợ chuyển chất lượng thủ công.')
        window.setTimeout(() => setToast(''), 2400)
        return
      }
      const levels = hls.levels || []
      if (levels.length <= 1) {
        setToast('Nguồn phim này chỉ có 1 chất lượng — không thể chuyển.')
        window.setTimeout(() => setToast(''), 2400)
        return
      }
      if (h == null) {
        hls.currentLevel = -1
        hls.nextLevel = -1
        let lastAllowed = -1
        for (let i = 0; i < levels.length; i++) {
          if (levels[i].height <= (maxHeight || 720)) lastAllowed = i
        }
        hls.autoLevelCapping = lastAllowed >= 0 ? lastAllowed : -1
        setSelectedHeight(null)
        setToast('Đã chuyển sang Tự động.')
        window.setTimeout(() => setToast(''), 1500)
        return
      }
      let idx = levels.findIndex((l) => l.height === h)
      if (idx < 0) {
        let best = -1
        for (let i = 0; i < levels.length; i++) {
          if (levels[i].height <= h && (best < 0 || levels[i].height > levels[best].height)) best = i
        }
        idx = best
      }
      if (idx >= 0) {
        hls.currentLevel = idx
        hls.nextLevel = idx
        hls.loadLevel = idx
        setSelectedHeight(h)
        const actual = levels[idx].height
        setToast(
          actual === h
            ? `Đang chuyển sang ${h}p (có thể mất vài giây).`
            : `Nguồn chỉ có tới ${actual}p — đã chọn chất lượng gần nhất.`
        )
        window.setTimeout(() => setToast(''), 2200)
      } else {
        setToast(`Phim này không hỗ trợ ${h}p`)
        window.setTimeout(() => setToast(''), 2200)
      }
    },
    [maxHeight]
  )

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed
  }, [speed, movie?.id])

  const poster = posterSrc(movie?.posterPath)

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-gradient-to-b from-zinc-950 via-black to-zinc-950 px-4 py-16">
        <div className="mx-auto max-w-5xl animate-pulse space-y-6">
          <div className="h-8 w-48 rounded bg-zinc-800" />
          <div className="aspect-video rounded-3xl bg-zinc-900" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-zinc-950 via-neutral-950 to-black pb-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_80%_70%_at_50%_-10%,rgba(244,63,94,0.18),transparent)]"
      />

      <div className="relative mx-auto max-w-5xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            to={`/movies/${mid}`}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-400 transition hover:border-brand-coral/50 hover:text-brand-coral"
          >
            ← Về trang phim
          </Link>
          <span className="text-zinc-600">/</span>
          <span className="truncate text-zinc-500">{movie?.title || 'Đang xem'}</span>
        </nav>

        {err ? (
          <div className="mt-10 rounded-2xl border border-red-500/30 bg-red-950/30 px-5 py-4 text-red-200">
            {err}
          </div>
        ) : !streamUrl ? (
          <div className="mt-10 rounded-2xl border border-amber-500/30 bg-amber-950/20 px-5 py-4 text-amber-200">
            Phim này chưa có nguồn phát. Vui lòng quay lại sau.
          </div>
        ) : (
          <>
            <header className="mt-10">
              <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {movie?.title || 'Đang phát'}
              </h1>
              {movie?.releaseYear ? (
                <p className="mt-2 text-sm text-zinc-500">
                  Phim lẻ · {movie.releaseYear}
                  {movie?.duration ? ` · ${movie.duration} phút` : ''}
                </p>
              ) : null}
            </header>

            <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-black/80 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/5 backdrop-blur">
              <div className="relative aspect-video w-full">
                <video
                  ref={videoRef}
                  key={`single-${movie?.id}`}
                  controls
                  playsInline
                  poster={poster || undefined}
                  className="h-full w-full bg-black object-contain"
                >
                  Trình duyệt không hỗ trợ phát trực tiếp luồng này.
                </video>
              </div>
            </div>

            {canChangeSpeed || allowedLadder.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                {canChangeSpeed && (
                  <>
                    <span className="font-semibold uppercase tracking-wider text-zinc-500">Tốc độ</span>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSpeed(s)}
                        className={`rounded-full px-3 py-1 transition ${
                          speed === s
                            ? 'bg-brand-coral text-white shadow shadow-brand-coral/30'
                            : 'border border-white/10 text-zinc-300 hover:border-brand-coral/40'
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </>
                )}
                {allowedLadder.length > 0 && (
                  <div className="ml-auto flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold uppercase tracking-wider text-zinc-500">Chất lượng</span>
                    <button
                      type="button"
                      onClick={() => pickQuality(null)}
                      className={`rounded-full px-3 py-1 transition ${
                        selectedHeight == null
                          ? 'bg-brand-coral text-white shadow shadow-brand-coral/30'
                          : 'border border-white/10 text-zinc-300 hover:border-brand-coral/40'
                      }`}
                    >
                      Tự động
                    </button>
                    {allowedLadder.map((q) => {
                      const isAvail = availableHeights.length === 0 || availableHeights.includes(q.h)
                      const isActive = selectedHeight === q.h
                      return (
                        <button
                          key={q.h}
                          type="button"
                          onClick={() => pickQuality(q.h)}
                          disabled={!isAvail}
                          title={isAvail ? '' : `Phim này không có ${q.label}`}
                          className={`rounded-full px-3 py-1 transition ${
                            isActive
                              ? 'bg-brand-coral text-white shadow shadow-brand-coral/30'
                              : isAvail
                              ? 'border border-white/10 text-zinc-300 hover:border-brand-coral/40'
                              : 'cursor-not-allowed border border-white/5 text-zinc-600 opacity-40'
                          }`}
                        >
                          {q.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {canDownload ? (
                <a
                  href={streamUrl}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-coral px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-coral/25 hover:bg-brand-accent"
                >
                  <svg className="size-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 11l5 5 5-5M12 5v11" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Tải xuống
                </a>
              ) : (
                <Link
                  to="/vip"
                  title="Tải offline là đặc quyền VIP. Nâng cấp để mở khoá."
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-zinc-500 transition hover:border-brand-coral/30 hover:text-brand-coral"
                >
                  <svg className="size-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 11V7a4 4 0 118 0v4M6 11h12a2 2 0 012 2v7a2 2 0 01-2 2H6a2 2 0 01-2-2v-7a2 2 0 012-2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Tải xuống (VIP)
                </Link>
              )}
            </div>

            {toast ? (
              <p className="mt-5 rounded-xl border border-brand-coral/30 bg-brand-coral/10 px-4 py-3 text-sm text-brand-coral">
                {toast}
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
