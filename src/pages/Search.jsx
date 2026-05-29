import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import MovieCard from '../components/MovieCard.jsx'
import * as movieApi from '../services/movieApi'

export default function Search() {
  const [params, setParams] = useSearchParams()
  const qInit = params.get('q') ?? ''
  const [q, setQ] = useState(qInit)
  const [pageData, setPageData] = useState({ content: [], totalPages: 0 })
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    document.title = qInit ? `Tìm: ${qInit} — VieStream` : 'Tìm kiếm — VieStream'
  }, [qInit])

  async function run(term, p = 0) {
    if (!term.trim()) {
      setPageData({ content: [], totalPages: 0 })
      return
    }
    setLoading(true)
    setErr('')
    try {
      const data = await movieApi.searchMovies(t, { page: p, size: 16 })
      setPageData({
        content: data.content || [],
        totalPages: data.totalPages ?? 1,
      })
      setPage(p)
    } catch (e) {
      setErr(e.response?.data?.message || e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (qInit) {
      setQ(qInit)
      run(qInit, 0).catch(() => {})
    }
  }, [qInit])

  function onSubmit(e) {
    e.preventDefault()
    const term = q.trim()
    if (!term) {
      setParams({}, { replace: true })
      setPageData({ content: [], totalPages: 0 })
      setPage(0)
      setErr('')
      return
    }
    setParams({ q: term }, { replace: true })
    run(term, 0).catch(() => {})
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      <h1 className="text-3xl font-bold text-white">Tìm kiếm</h1>
      <form onSubmit={onSubmit} className="mt-8 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nhập từ khóa…"
          className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100"
        />
        <button
          type="submit"
          className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-black"
        >
          Tìm
        </button>
      </form>

      {err ? <p className="mt-6 text-red-400">{err}</p> : null}

      {loading ? (
        <p className="mt-8 text-zinc-500">Đang tìm…</p>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap gap-4">
            {pageData.content.map((m) => (
              <MovieCard key={m.id} movie={m} />
            ))}
          </div>
          {!loading && qInit && pageData.content.length === 0 ? (
            <p className="mt-8 text-zinc-500">
              Không có kết quả.{' '}
              <Link to="/explore" className="text-emerald-500 hover:underline">
                Khám phá
              </Link>
            </p>
          ) : null}
        </>
      )}

      {pageData.totalPages > 1 ? (
        <div className="mt-8 flex justify-center gap-4">
          <button
            type="button"
            disabled={page <= 0}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm disabled:opacity-40"
            onClick={() => run(params.get('q') || q, page - 1)}
          >
            Trước
          </button>
          <button
            type="button"
            disabled={page >= pageData.totalPages - 1}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm disabled:opacity-40"
            onClick={() => run((params.get('q') || q).trim(), page + 1)}
          >
            Sau
          </button>
        </div>
      ) : null}
    </div>
  )
}
