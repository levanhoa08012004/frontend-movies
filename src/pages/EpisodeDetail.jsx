import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Hls from 'hls.js'
import { useAuth } from '../context/useAuth.js'
import { useBenefit } from '../context/useVipBenefits.js'
import * as movieApi from '../services/movieApi'
import * as userActivityApi from '../services/userActivityApi'
import { streamSuggestedName } from '../utils/download.js'
import { posterSrc } from '../utils/posterUrl'

export default function EpisodeDetail() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { movieId, episodeNumber } = useParams()
  const mid = Number(movieId)
  const epNum = Number(episodeNumber)
  const [searchParams, setSearchParams] = useSearchParams()
  const serverName = searchParams.get('serverName') || ''
  const serverLegacy = searchParams.get('server') || ''

  const [episode, setEpisode] = useState(null)
  const [movie, setMovie] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  // Download modal: hiện popup với progress khi user bấm Tải xuống.
  // Sự khác biệt vs <a href download>: button + fetch+blob đảm bảo browser TRIGGER
  // hộp thoại "Save as" cho mọi loại URL (không mở URL trong tab mới).
  const [downloadModal, setDownloadModal] = useState(null) // {phase, message, progress?}
  const downloadAbortRef = useRef(null)

  // VIP benefits
  const maxHeight = useBenefit('MAX_VIDEO_HEIGHT', 720)
  // Tốc độ phát: mở mặc định cho mọi user (giống autoplay). Player utility phổ
  // thông — YouTube/Netflix đều cho dùng miễn phí. Vẫn đọc benefit để admin
  // override được nếu muốn gate, fallback true.
  const canChangeSpeed = useBenefit('PLAYBACK_SPEED_UNLOCKED', true)
  // Autoplay: mở mặc định cho mọi user (UX phổ thông, không gate VIP).
  // Vẫn đọc benefit để ưu tiên cài đặt admin nếu được set, fallback true.
  const canAutoplay = useBenefit('AUTOPLAY_NEXT', true)
  const offlineQuota = useBenefit('OFFLINE_QUOTA_MONTHLY', 0)
  const canDownload = Number(offlineQuota) !== 0

  const videoRef = useRef(null)
  const hlsRef = useRef(null)
  const [speed, setSpeed] = useState(1)
  const [countdown, setCountdown] = useState(null)
  // Quality ladder — tier càng cao càng nhiều lựa chọn (NONE=720, VIP=1080, VIPPRO=1440, PRIME=2160).
  // Ladder full = [480, 720, 1080, 1440, 2160]; show theo maxHeight cap.
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
  const [availableHeights, setAvailableHeights] = useState([])
  const [selectedHeight, setSelectedHeight] = useState(null) // null = Auto

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      setErr('')
      try {
        const data = await movieApi.getEpisode(mid, epNum, {
          server: serverLegacy,
          serverName: serverName.trim() ? serverName.trim() : undefined,
        })
        if (!alive) return
        setEpisode(data)
        document.title = `${data.title || `Tập ${epNum}`} — VieStream`
      } catch (e) {
        if (alive) setErr(e.response?.data?.message || e.message || 'Không thể phát tập này.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [mid, epNum, serverLegacy, serverName])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const data = await movieApi.getMovie(mid, true)
        if (alive) setMovie(data)
      } catch {
        /* silent: strip is optional UX */
      }
    })()
    return () => {
      alive = false
    }
  }, [mid])

  // R57+ — chỉ log "watch" khi user thực sự PLAY (bấm ▶ hoặc autoplay).
  // Trước đây log ngay khi mount → mọi lần preview / mở nhầm cũng tạo row.
  // User yêu cầu chỉ ghi lịch sử khi bắt đầu xem thật.
  const playLoggedRef = useRef(false)
  const playStartedAtRef = useRef(null)
  useEffect(() => {
    playLoggedRef.current = false
    playStartedAtRef.current = null
  }, [mid, epNum])

  useEffect(() => {
    if (!user || !episode || err) return
    const video = videoRef.current
    if (!video) return
    // Chỉ đánh dấu "đã play" để unmount-duration biết có nên gửi không.
    // KHÔNG post `watch` ở đây — sẽ gây trùng row với cái post-on-unmount.
    function onPlay() {
      if (playStartedAtRef.current == null) {
        playStartedAtRef.current = Date.now()
      }
      playLoggedRef.current = true
    }
    video.addEventListener('play', onPlay)
    return () => video.removeEventListener('play', onPlay)
  }, [mid, epNum, err, user?.id, episode?.episodeNumber])

  // Khi user rời tập — gửi duration update. CHỈ gửi nếu đã PLAY (playLoggedRef)
  // và đã xem ≥5s; tránh row trống cho lần mở-rồi-đóng.
  useEffect(() => {
    if (!user || !episode) return
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
      userActivityApi.postWatchDuration(mid, sec, epNum).catch(() => {})
    }
  }, [mid, epNum, user?.id, episode?.episodeNumber])

  const servers = useMemo(() => {
    if (!episode) return []
    const fromApi = episode.availableServerNames?.length ? [...episode.availableServerNames] : []
    if (!fromApi.length && episode.serverName) return [episode.serverName]
    return [...new Set(fromApi)].sort((a, b) => a.localeCompare(b, 'vi'))
  }, [episode])

  const episodeList = useMemo(() => {
    const rows = movie?.episodes || []
    const seen = new Set()
    const uniq = []
    for (const e of rows) {
      const k = e.episodeNumber
      if (k == null || seen.has(k)) continue
      seen.add(k)
      uniq.push(e)
    }
    return uniq.sort((a, b) => Number(a.episodeNumber) - Number(b.episodeNumber))
  }, [movie?.episodes])

  const currentIdx = useMemo(
    () => episodeList.findIndex((e) => Number(e.episodeNumber) === epNum),
    [episodeList, epNum]
  )
  const prevEp = currentIdx > 0 ? episodeList[currentIdx - 1] : null
  const nextEp =
    currentIdx >= 0 && currentIdx < episodeList.length - 1 ? episodeList[currentIdx + 1] : null

  const thumb = posterSrc(movie?.posterPath)

  const pickServer = useCallback(
    (name) => {
      const next = new URLSearchParams(searchParams)
      if (name) next.set('serverName', name)
      else next.delete('serverName')
      next.delete('server')
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  function epLinkTo(ep) {
    if (!ep) return '#'
    const qs = ep.serverName ? `?serverName=${encodeURIComponent(ep.serverName)}` : ''
    return `/movies/${mid}/episodes/${ep.episodeNumber}${qs}`
  }

  async function handleDownload() {
    if (!streamUrl) return
    // Cảnh báo trước cho stream HLS (.m3u8) — fetch manifest only ≠ video file
    const isHls = /\.m3u8(\?|$)/i.test(streamUrl)
    if (isHls) {
      const proceed = window.confirm(
        'Nguồn phim này là stream HLS — chỉ tải về được file playlist (.m3u8) text nhỏ, không phải video MP4 hoàn chỉnh.\n\n' +
          'Để tải về video đầy đủ, bạn cần dùng công cụ ngoài (yt-dlp / ffmpeg) với URL stream. Vẫn tiếp tục tải playlist?'
      )
      if (!proceed) return
    }

    const controller = new AbortController()
    downloadAbortRef.current = controller
    setDownloadModal({ phase: 'fetching', progress: 0, message: 'Đang kết nối tới server nguồn…' })

    try {
      const response = await fetch(streamUrl, { signal: controller.signal })
      if (!response.ok) throw new Error(`Server trả về HTTP ${response.status}`)
      const total = Number(response.headers.get('content-length') || 0)
      const reader = response.body?.getReader()
      const chunks = []
      let received = 0
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
          received += value.length
          if (total > 0) {
            setDownloadModal({
              phase: 'fetching',
              progress: Math.round((received / total) * 100),
              message: `Đã tải ${(received / 1024 / 1024).toFixed(1)} MB / ${(total / 1024 / 1024).toFixed(1)} MB`,
            })
          } else {
            setDownloadModal({
              phase: 'fetching',
              progress: 0,
              message: `Đã tải ${(received / 1024 / 1024).toFixed(1)} MB (server không báo dung lượng)`,
            })
          }
        }
      }
      const blob = new Blob(chunks)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = downloadName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setDownloadModal({
        phase: 'done',
        message: `Đã lưu file "${downloadName}" vào thư mục Tải xuống của trình duyệt.`,
      })
    } catch (e) {
      if (e.name === 'AbortError') {
        setDownloadModal(null)
        return
      }
      const msg = e.message || String(e)
      setDownloadModal({
        phase: 'error',
        message:
          `Không tải được: ${msg}. ` +
          'Thường do CORS (server nguồn chặn tải trực tiếp). Bạn có thể dùng yt-dlp với URL stream để tải bằng công cụ ngoài.',
      })
    } finally {
      downloadAbortRef.current = null
    }
  }

  function cancelDownload() {
    if (downloadAbortRef.current) {
      downloadAbortRef.current.abort()
      downloadAbortRef.current = null
    }
    setDownloadModal(null)
  }

  const streamUrl = episode?.videoUrl || episode?.link_m3u8
  const embedUrl = episode?.embedUrl || episode?.link_embed
  const downloadName = streamUrl ? streamSuggestedName(epNum, streamUrl) : `VieStream-tap-${epNum}.m3u8`

  // Khởi tạo HLS player với quality cap theo tier
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
          // Tìm level cao nhất <= maxHeight để cap khi Auto
          let lastAllowed = -1
          for (let i = 0; i < levels.length; i++) {
            if (levels[i].height <= maxHeight) lastAllowed = i
          }
          hls.autoLevelCapping = lastAllowed >= 0 ? lastAllowed : -1
        }
        // Trữ heights có sẵn để selector biết button nào enable
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
  }, [streamUrl, maxHeight, episode?.id, episode?.serverName])

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
        // Auto: bỏ manual override, vẫn cap theo maxHeight
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
      // Manual: tìm level đúng height hoặc fallback xuống chất lượng gần nhất <= h
      let idx = levels.findIndex((l) => l.height === h)
      if (idx < 0) {
        let best = -1
        for (let i = 0; i < levels.length; i++) {
          if (levels[i].height <= h && (best < 0 || levels[i].height > levels[best].height)) best = i
        }
        idx = best
      }
      if (idx >= 0) {
        // hls.currentLevel force-switch ngay segment kế; nextLevel ensure segment tiếp
        // theo cũng giữ level này; loadLevel áp dụng cho buffer đang fetch.
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
        setToast(`Tập này không hỗ trợ ${h}p`)
        window.setTimeout(() => setToast(''), 2200)
      }
    },
    [maxHeight]
  )

  // Áp playback speed
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed
  }, [speed, episode?.id])

  // Autoplay tập tiếp countdown — bind listener khi video element xuất hiện.
  // streamUrl + serverName là phần trong key của <video>; khi đổi, React unmount/mount
  // element mới → cần re-attach listener.
  useEffect(() => {
    if (!canAutoplay || !nextEp || !streamUrl) return
    const video = videoRef.current
    if (!video) return
    function onEnded() {
      setCountdown(5)
    }
    video.addEventListener('ended', onEnded)
    return () => video.removeEventListener('ended', onEnded)
  }, [canAutoplay, nextEp, streamUrl, episode?.id, episode?.serverName])

  useEffect(() => {
    if (countdown == null) return
    if (countdown <= 0) {
      navigate(epLinkTo(nextEp))
      setCountdown(null)
      return
    }
    const tid = window.setTimeout(() => setCountdown(countdown - 1), 1000)
    return () => window.clearTimeout(tid)
  }, [countdown, navigate, nextEp, mid])

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
          <span className="text-zinc-500">
            {movie?.title ? `${movie.title} · ` : ''}Tập {epNum}
          </span>
        </nav>

        {err ? (
          <div className="mt-10 rounded-2xl border border-red-500/30 bg-red-950/30 px-5 py-4 text-red-200">
            {err}
          </div>
        ) : episode ? (
          <>
            <header className="mt-10">
              <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {episode.title || `Tập ${epNum}`}
              </h1>
              {episode.serverName ? (
                <p className="mt-2 text-sm text-zinc-500">
                  Đang phát{' '}
                  <span className="font-medium text-brand-coral/95">{episode.serverName}</span>
                </p>
              ) : null}
            </header>

            {servers.length > 1 ? (
              <div className="mt-8">
                <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
                  Chọn nguồn phát
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {servers.map((name) => {
                    const active = episode.serverName === name
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => pickServer(name)}
                        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                          active
                            ? 'bg-brand-coral text-white shadow-lg shadow-brand-coral/30'
                            : 'border border-white/10 bg-white/5 text-zinc-300 hover:border-brand-coral/40 hover:bg-white/10'
                        }`}
                      >
                        {name}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}

            <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-black/80 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_24px_80px_rgba(0,0,0,0.55)] ring-1 ring-white/5 backdrop-blur">
              <div className="relative aspect-video w-full">
                {streamUrl ? (
                  <video
                    ref={videoRef}
                    key={`${episode.id}-${episode.serverName}`}
                    controls
                    playsInline
                    className="h-full w-full bg-black object-contain"
                  >
                    Trình duyệt không hỗ trợ phát trực tiếp luồng này.
                  </video>
                ) : embedUrl ? (
                  <iframe title="Người xem VieStream" className="h-full w-full" src={embedUrl} />
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-center text-zinc-500">
                    Không có nguồn phát cho tập này.
                  </div>
                )}

                {countdown !== null && nextEp ? (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/85 backdrop-blur-sm">
                    <div className="text-center">
                      <p className="text-xs uppercase tracking-wider text-brand-coral">Tự động phát</p>
                      <p className="font-display mt-2 text-3xl font-bold text-white">
                        Tập sau sau {countdown}s
                      </p>
                      {nextEp.title && (
                        <p className="mt-1 text-sm text-zinc-300">{nextEp.title}</p>
                      )}
                      <div className="mt-5 flex justify-center gap-2">
                        <button onClick={() => navigate(epLinkTo(nextEp))}
                          className="rounded-full bg-brand-coral px-5 py-2 text-sm font-bold text-white shadow hover:bg-brand-accent">
                          Xem ngay
                        </button>
                        <button onClick={() => setCountdown(null)}
                          className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-zinc-200 hover:bg-white/5">
                          Huỷ
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {streamUrl && (canChangeSpeed || allowedLadder.length > 0) ? (
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                {canChangeSpeed && (
                  <>
                    <span className="font-semibold uppercase tracking-wider text-zinc-500">Tốc độ</span>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                      <button key={s} onClick={() => setSpeed(s)}
                        className={`rounded-full px-3 py-1 transition ${
                          speed === s
                            ? 'bg-brand-coral text-white shadow shadow-brand-coral/30'
                            : 'border border-white/10 text-zinc-300 hover:border-brand-coral/40'
                        }`}>
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
                          title={isAvail ? '' : `Tập này không có ${q.label}`}
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

            {episodeList.length > 1 ? (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <Link
                  to={epLinkTo(prevEp)}
                  aria-disabled={!prevEp}
                  className={`inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition ${
                    prevEp
                      ? 'hover:border-brand-coral/50 hover:text-brand-coral'
                      : 'pointer-events-none opacity-30'
                  }`}
                >
                  ← Tập trước
                </Link>
                <span className="text-xs text-zinc-500">
                  Tập {epNum} / {episodeList.length}
                </span>
                <Link
                  to={epLinkTo(nextEp)}
                  aria-disabled={!nextEp}
                  className={`inline-flex items-center gap-2 rounded-xl bg-brand-coral px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-coral/25 transition ${
                    nextEp ? 'hover:bg-brand-accent' : 'pointer-events-none opacity-30'
                  }`}
                >
                  Tập sau →
                </Link>
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {streamUrl && canDownload ? (
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-coral px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-coral/25 hover:bg-brand-accent"
                >
                  <svg className="size-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 11l5 5 5-5M12 5v11"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Tải xuống
                </button>
              ) : streamUrl ? (
                <Link
                  to="/vip"
                  title="Tải offline là đặc quyền VIPPRO / PRIME. Nâng cấp để mở khoá."
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-semibold text-zinc-500 transition hover:border-brand-coral/30 hover:text-brand-coral"
                >
                  <svg className="size-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 11V7a4 4 0 118 0v4M6 11h12a2 2 0 012 2v7a2 2 0 01-2 2H6a2 2 0 01-2-2v-7a2 2 0 012-2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Tải xuống (VIP)
                </Link>
              ) : null}
            </div>

            {toast ? (
              <p className="mt-5 rounded-xl border border-brand-coral/30 bg-brand-coral/10 px-4 py-3 text-sm text-brand-coral">
                {toast}
              </p>
            ) : null}

            {episodeList.length > 1 ? (
              <section className="mt-12">
                <div className="mb-4 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-coral">
                      Tập khác
                    </p>
                    <h2 className="font-display mt-1 text-lg font-bold text-white">
                      Xem tiếp các tập
                    </h2>
                  </div>
                  <Link
                    to={`/movies/${mid}`}
                    className="text-xs text-zinc-400 transition hover:text-brand-coral"
                  >
                    Xem tất cả →
                  </Link>
                </div>
                <div className="vie-scrollbar-thin -mx-4 flex gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
                  {episodeList.map((e) => {
                    const isCurrent = Number(e.episodeNumber) === epNum
                    return (
                      <Link
                        key={`strip-${e.episodeNumber}`}
                        to={epLinkTo(e)}
                        className={`group relative aspect-video w-52 shrink-0 overflow-hidden rounded-xl border bg-zinc-900/70 transition ${
                          isCurrent
                            ? 'border-brand-coral ring-2 ring-brand-coral/60'
                            : 'border-white/10 hover:border-brand-coral/40'
                        }`}
                      >
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={`Tập ${e.episodeNumber}`}
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover object-top opacity-70 transition group-hover:opacity-95"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-neutral-900 to-black" />
                        )}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/15" />
                        <div className="absolute inset-x-0 bottom-0 p-2.5">
                          <p className="font-display text-lg font-bold leading-none text-white drop-shadow">
                            Tập {e.episodeNumber}
                          </p>
                          {e.title && e.title !== `Tập ${e.episodeNumber}` ? (
                            <p className="mt-1 line-clamp-1 text-[11px] text-zinc-300/85">{e.title}</p>
                          ) : null}
                        </div>
                        {isCurrent ? (
                          <span className="absolute right-2 top-2 rounded-md bg-brand-coral px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                            Đang xem
                          </span>
                        ) : null}
                      </Link>
                    )
                  })}
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </div>

      {downloadModal ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm"
          onClick={downloadModal.phase === 'fetching' ? undefined : cancelDownload}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-bold text-white">
              {downloadModal.phase === 'fetching'
                ? 'Đang tải video…'
                : downloadModal.phase === 'done'
                ? 'Tải xuống hoàn tất'
                : 'Tải xuống thất bại'}
            </h3>

            {downloadModal.phase === 'fetching' ? (
              <>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full bg-brand-coral transition-all"
                    style={{
                      width: downloadModal.progress > 0 ? `${downloadModal.progress}%` : '15%',
                      animation: downloadModal.progress === 0 ? 'pulse 1.5s ease-in-out infinite' : undefined,
                    }}
                  />
                </div>
                <p className="mt-3 text-sm text-zinc-400">{downloadModal.message}</p>
                {downloadModal.progress > 0 ? (
                  <p className="mt-1 text-xs text-zinc-600">{downloadModal.progress}%</p>
                ) : null}
                <button
                  type="button"
                  onClick={cancelDownload}
                  className="mt-5 w-full rounded-xl border border-white/15 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-white/5"
                >
                  Huỷ tải
                </button>
              </>
            ) : downloadModal.phase === 'done' ? (
              <>
                <p className="mt-3 text-sm text-emerald-200">{downloadModal.message}</p>
                <button
                  type="button"
                  onClick={() => setDownloadModal(null)}
                  className="mt-5 w-full rounded-xl bg-brand-coral py-2.5 text-sm font-bold text-white hover:bg-brand-accent"
                >
                  Đóng
                </button>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm text-red-200">{downloadModal.message}</p>
                <button
                  type="button"
                  onClick={() => setDownloadModal(null)}
                  className="mt-5 w-full rounded-xl border border-white/15 py-2.5 text-sm font-semibold text-zinc-200 hover:bg-white/5"
                >
                  Đóng
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
