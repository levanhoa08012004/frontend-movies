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
      const data = await movieApi.searchMovies(term, { page: p, size: 18 })
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
    <div className="relative min-h-screen bg-gradient-to-b from-black via-neutral-950 to-zinc-950">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(244,63,94,0.14),transparent)]"
      />
      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-coral">Khám phá kho phim</p>
        <h1 className="font-display mt-2 text-3xl font-bold text-white sm:text-4xl">Tìm kiếm</h1>
        <form onSubmit={onSubmit} className="mt-8 flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nhập từ khóa…"
            className="flex-1 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-zinc-100 placeholder:text-zinc-500 focus:border-brand-coral/50 focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-full bg-brand-coral px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-coral/25 hover:bg-brand-accent"
          >
            Tìm
          </button>
        </form>

        {err ? <p className="mt-6 text-red-400">{err}</p> : null}

        {loading ? (
          <p className="mt-8 text-zinc-500">Đang tìm…</p>
        ) : (
          <>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {pageData.content.map((m) => (
                <MovieCard key={m.id} movie={m} widthClass="w-full" showTitleBelow />
              ))}
            </div>
            {!loading && qInit && pageData.content.length === 0 ? (
              <p className="mt-8 text-zinc-500">
                Không có kết quả.{' '}
                <Link to="/explore" className="text-brand-coral hover:underline">
                  Khám phá
                </Link>
              </p>
            ) : null}
          </>
        )}

        {pageData.totalPages > 1 ? (
          <div className="mt-10 flex items-center justify-center gap-4">
            <button
              type="button"
              disabled={page <= 0}
              className="rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-zinc-300 transition hover:border-brand-coral/50 disabled:opacity-30"
              onClick={() => run(params.get('q') || q, page - 1)}
            >
              ← Trước
            </button>
            <span className="text-sm tabular-nums text-zinc-500">
              {page + 1} / {pageData.totalPages}
            </span>
            <button
              type="button"
              disabled={page >= pageData.totalPages - 1}
              className="rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-zinc-300 transition hover:border-brand-coral/50 disabled:opacity-30"
              onClick={() => run((params.get('q') || q).trim(), page + 1)}
            >
              Sau →
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
