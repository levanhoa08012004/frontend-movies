import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { posterSrc } from '../utils/posterUrl'

function categorize(serverName) {
  const s = (serverName || '').toLowerCase()
  if (
    s.includes('thuyết minh') ||
    s.includes('thuyet minh') ||
    s.includes('lồng tiếng') ||
    s.includes('long tieng') ||
    s.includes('dub')
  ) {
    return 'DUB'
  }
  return 'SUB'
}

function groupByEpisode(episodes) {
  const map = new Map()
  for (const e of episodes) {
    const k = e.episodeNumber
    if (!map.has(k)) map.set(k, [])
    map.get(k).push(e)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([num, rows]) => ({ episodeNumber: num, sources: rows }))
}

export default function EpisodePicker({ movieId, posterPath, episodes }) {
  const [tab, setTab] = useState('SUB')
  const thumb = posterSrc(posterPath)

  const { subEps, dubEps } = useMemo(() => {
    const sub = []
    const dub = []
    for (const e of episodes || []) {
      if (categorize(e.serverName) === 'DUB') dub.push(e)
      else sub.push(e)
    }
    return { subEps: groupByEpisode(sub), dubEps: groupByEpisode(dub) }
  }, [episodes])

  const hasDub = dubEps.length > 0
  const hasSub = subEps.length > 0
  const activeList = tab === 'DUB' ? dubEps : subEps

  if (!hasSub && !hasDub) {
    return (
      <div className="mt-10 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-6 text-sm text-zinc-400">
        Chưa có nguồn phát cho phim này.
      </div>
    )
  }

  return (
    <section className="mt-12">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-coral">
            Danh sách tập
          </p>
          <h3 className="font-display mt-1 text-2xl font-bold text-white">
            Chọn tập để xem
          </h3>
        </div>
        <span className="text-sm text-zinc-500">
          {activeList.length} tập có nguồn
        </span>
      </div>

      <div className="mb-5 inline-flex rounded-full border border-white/10 bg-white/[0.04] p-1">
        {hasSub ? (
          <button
            type="button"
            onClick={() => setTab('SUB')}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              tab === 'SUB'
                ? 'bg-brand-coral text-white shadow-lg shadow-brand-coral/30'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            Vietsub ({subEps.length})
          </button>
        ) : null}
        {hasDub ? (
          <button
            type="button"
            onClick={() => setTab('DUB')}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              tab === 'DUB'
                ? 'bg-brand-coral text-white shadow-lg shadow-brand-coral/30'
                : 'text-zinc-300 hover:text-white'
            }`}
          >
            Thuyết minh ({dubEps.length})
          </button>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {activeList.map(({ episodeNumber, sources }) => {
          const preferred =
            sources.find((s) => categorize(s.serverName) === tab) || sources[0]
          const epTitle =
            preferred?.title && preferred.title !== `Tập ${episodeNumber}`
              ? preferred.title
              : null
          return (
            <Link
              key={`${tab}-${episodeNumber}`}
              to={`/movies/${movieId}/episodes/${episodeNumber}${
                preferred?.serverName
                  ? `?serverName=${encodeURIComponent(preferred.serverName)}`
                  : ''
              }`}
              className="group relative block aspect-video overflow-hidden rounded-xl border border-white/10 bg-zinc-900/70 ring-1 ring-white/[0.04] shadow-lg shadow-black/40 transition duration-300 hover:-translate-y-1 hover:border-brand-coral/55 hover:ring-brand-coral/30"
              title={preferred?.serverName || `Tập ${episodeNumber}`}
            >
              {thumb ? (
                <img
                  src={thumb}
                  alt={`Tập ${episodeNumber}`}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover object-top opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-95"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-neutral-900 to-black" />
              )}

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/15" />

              <div className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition group-hover:opacity-100">
                <span className="grid size-12 place-items-center rounded-full bg-brand-coral/90 text-white shadow-xl shadow-brand-coral/40">
                  <svg
                    viewBox="0 0 24 24"
                    className="size-5 translate-x-[1px]"
                    fill="currentColor"
                  >
                    <path d="M8 5v14l11-7L8 5z" />
                  </svg>
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-3">
                <p className="font-display text-2xl font-bold leading-none text-white drop-shadow">
                  Tập {episodeNumber}
                </p>
                {epTitle ? (
                  <p className="mt-1 line-clamp-1 text-xs text-zinc-300/90">
                    {epTitle}
                  </p>
                ) : null}
              </div>

              {preferred?.serverName ? (
                <span className="absolute right-2 top-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-200 backdrop-blur">
                  {preferred.serverName}
                </span>
              ) : null}

              {sources.length > 1 ? (
                <span className="absolute left-2 top-2 rounded-md border border-brand-coral/40 bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-brand-coral backdrop-blur">
                  {sources.length} nguồn
                </span>
              ) : null}
            </Link>
          )
        })}
      </div>

      {activeList.some((e) => e.sources.length > 1) ? (
        <p className="mt-5 text-xs text-zinc-500">
          ℹ Một số tập có nhiều nguồn — bạn có thể đổi nguồn ở trang xem phim.
        </p>
      ) : null}
    </section>
  )
}
