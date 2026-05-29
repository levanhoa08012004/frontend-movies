import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import * as movieApi from '../services/movieApi'

function groupByEpisode(rows) {
  const m = new Map()
  for (const row of rows) {
    const n = row.episodeNumber
    if (n === undefined || n === null) continue
    if (!m.has(n)) m.set(n, [])
    m.get(n).push(row)
  }
  return [...m.entries()].sort((a, b) => Number(a[0]) - Number(b[0]))
}

export default function EpisodeList() {
  const { id } = useParams()
  const movieId = Number(id)
  const [pg, setPg] = useState({ content: [], totalPages: 0 })
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)

  async function load(p) {
    setLoading(true)
    try {
      const data = await movieApi.listEpisodes(movieId, { page: p, size: 40 })
      setPg({ content: data.content || [], totalPages: data.totalPages ?? 1 })
      setPage(data.number ?? p)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(0).catch(() => {})
    document.title = `Các tập phim — VieStream`
  }, [movieId])

  const grouped = useMemo(() => groupByEpisode(pg.content), [pg.content])

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-neutral-950 to-zinc-950 pb-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_80%_-20%,rgba(45,212,191,0.14),transparent)]" />
      <div className="relative mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6">
        <Link
          to={`/movies/${movieId}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-emerald-400/90 hover:text-emerald-300"
        >
          ← Về trang phim
        </Link>

        <h1 className="font-display mt-8 text-3xl font-bold tracking-tight text-white">
          Chọn tập
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          Mỗi tập có thể có nhiều phiên bản vietsub/thuyết minh… Chọn nguồn trước khi phát.
        </p>

        {loading ? (
          <div className="mt-12 space-y-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-20 animate-pulse rounded-2xl bg-zinc-900/90" />
            ))}
          </div>
        ) : (
          <>
            <ul className="mt-10 space-y-3">
              {grouped.map(([epNum, sources]) => {
                const titles = [...new Set(sources.map((s) => s.title).filter(Boolean))]
                const label = titles[0] ? titles[0] : `Tập ${epNum}`
                return (
                  <li
                    key={String(epNum)}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <span className="font-display text-lg font-semibold text-white">
                          Tập {epNum}
                        </span>
                        {label !== `Tập ${epNum}` ? (
                          <p className="mt-2 line-clamp-2 text-xs text-zinc-500">{label}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {[...sources]
                        .sort((a, b) => String(a.serverName).localeCompare(String(b.serverName), 'vi'))
                        .map((s) => (
                          <Link
                            key={s.id}
                            to={`/movies/${movieId}/episodes/${epNum}${
                              s.serverName
                                ? `?serverName=${encodeURIComponent(s.serverName)}`
                                : ''
                            }`}
                            className="inline-flex items-center rounded-xl border border-white/15 bg-black/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-200 transition hover:border-emerald-400/55 hover:bg-emerald-500/10 hover:text-emerald-200"
                          >
                            {s.serverName || 'Nguồn'}
                          </Link>
                        ))}
                    </div>
                  </li>
                )
              })}
            </ul>

            {pg.totalPages > 1 ? (
              <div className="mt-10 flex items-center justify-center gap-6">
                <button
                  type="button"
                  disabled={page <= 0}
                  className="rounded-full border border-white/15 px-6 py-2 text-sm font-medium text-zinc-300 transition hover:border-emerald-500/50 disabled:opacity-30"
                  onClick={() => load(page - 1)}
                >
                  ← Trước
                </button>
                <span className="text-sm tabular-nums text-zinc-500">
                  {page + 1} / {pg.totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= pg.totalPages - 1}
                  className="rounded-full border border-white/15 px-6 py-2 text-sm font-medium text-zinc-300 transition hover:border-emerald-500/50 disabled:opacity-30"
                  onClick={() => load(page + 1)}
                >
                  Sau →
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
