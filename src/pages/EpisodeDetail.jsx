import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import * as movieApi from '../services/movieApi'
import * as userActivityApi from '../services/userActivityApi'
import { copyToClipboard, streamSuggestedName } from '../utils/download.js'

export default function EpisodeDetail() {
  const { user } = useAuth()
  const { movieId, episodeNumber } = useParams()
  const mid = Number(movieId)
  const epNum = Number(episodeNumber)
  const [searchParams, setSearchParams] = useSearchParams()
  const serverName = searchParams.get('serverName') || ''
  const serverLegacy = searchParams.get('server') || ''

  const [episode, setEpisode] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

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
    if (!episode || err || !user) return
    userActivityApi.postWatchBehaviorDeduped(user.id, mid).catch(() => {})
  }, [mid, epNum, err, episode?.episodeNumber, user?.id])

  const servers = useMemo(() => {
    if (!episode) return []
    const fromApi = episode.availableServerNames?.length ? [...episode.availableServerNames] : []
    if (!fromApi.length && episode.serverName) return [episode.serverName]
    return [...new Set(fromApi)].sort((a, b) => a.localeCompare(b, 'vi'))
  }, [episode])

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

  async function handleCopy(link) {
    const ok = await copyToClipboard(link)
    setToast(ok ? 'Đã sao chép liên kết vào clipboard.' : 'Không sao chép được — vui lòng copy tay.')
    window.setTimeout(() => setToast(''), 2600)
  }

  const streamUrl = episode?.videoUrl || episode?.link_m3u8
  const embedUrl = episode?.embedUrl || episode?.link_embed
  const downloadName = streamUrl ? streamSuggestedName(epNum, streamUrl) : `VieStream-tap-${epNum}.m3u8`

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
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_80%_70%_at_50%_-10%,rgba(52,211,153,0.18),transparent)]"
      />

      <div className="relative mx-auto max-w-5xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            to={`/movies/${mid}/episodes`}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-zinc-400 transition hover:border-emerald-500/40 hover:text-emerald-300"
          >
            ← Danh sách tập
          </Link>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-500">Tập {epNum}</span>
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
                  <span className="font-medium text-emerald-400/95">{episode.serverName}</span>
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
                            ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/25'
                            : 'border border-white/10 bg-white/5 text-zinc-300 hover:border-emerald-500/35 hover:bg-white/10'
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
              <div className="aspect-video w-full">
                {streamUrl ? (
                  <video
                    key={`${episode.id}-${episode.serverName}`}
                    controls
                    playsInline
                    className="h-full w-full bg-black object-contain"
                    src={streamUrl}
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
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {streamUrl ? (
                <a
                  href={streamUrl}
                  download={downloadName}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-400"
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
                </a>
              ) : null}
              <button
                type="button"
                disabled={!streamUrl && !embedUrl}
                onClick={() => handleCopy(streamUrl || embedUrl)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-100 transition hover:border-emerald-500/40 hover:bg-white/10 disabled:opacity-40"
              >
                Sao chép liên kết
              </button>
              {(streamUrl || embedUrl) && (
                <a
                  href={streamUrl || embedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-zinc-500 underline underline-offset-4 hover:text-emerald-400"
                >
                  Mở bằng trình khác (VLC, trình duyệt khác…)
                </a>
              )}
            </div>

            {toast ? (
              <p className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-100">
                {toast}
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}
