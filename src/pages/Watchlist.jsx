import { useCallback, useEffect, useState } from 'react'
import MovieCard from '../components/MovieCard.jsx'
import * as userActivityApi from '../services/userActivityApi'

export default function Watchlist() {
  const [pg, setPg] = useState({ content: [], totalPages: 0 })
  const [page, setPage] = useState(0)

  const load = useCallback(async () => {
    const data = await userActivityApi.watchlist({ page, size: 20 })
    setPg({ content: data.content || [], totalPages: data.totalPages ?? 1 })
  }, [page])

  useEffect(() => {
    document.title = 'Xem sau — VieStream'
    load().catch(() => {})
  }, [load])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      <h1 className="text-3xl font-bold text-white">Danh sách xem sau</h1>
      <p className="mt-1 text-sm text-zinc-400">Phim bạn đã thêm vào xem sau; bấm xóa để gỡ khỏi danh sách.</p>


      <div className="mt-10 flex flex-wrap gap-6">
        {pg.content.map((m) => (
          <div key={m.id} className="flex flex-col items-center gap-2">
            <MovieCard movie={m} />
            <button
              type="button"
              className="text-xs text-red-400 underline"
              onClick={async () => {
                await userActivityApi.removeWatchlist(m.id)
                await load().catch(() => {})
              }}
            >
              Xóa
            </button>
          </div>
        ))}
      </div>

      {pg.totalPages > 1 ? (
        <div className="mt-8 flex justify-center gap-4">
          <button
            type="button"
            disabled={page <= 0}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm disabled:opacity-40"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            ←
          </button>
          <button
            type="button"
            disabled={page >= pg.totalPages - 1}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm disabled:opacity-40"
            onClick={() => setPage((p) => p + 1)}
          >
            →
          </button>
        </div>
      ) : null}
    </div>
  )
}
