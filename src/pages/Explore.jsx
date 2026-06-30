import { useCallback, useEffect, useState } from 'react'
import MovieCard from '../components/MovieCard.jsx'
import { MOVIE_KINDS } from '../constants/backend'
import * as movieApi from '../services/movieApi'

const PAGE_SIZE = 12

const EMPTY = { genre: '', country: '', year: '', keyword: '', kind: '' }

/** Ô nhập có nhãn — tránh ô quá nhỏ, dễ bấm */
function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</label>
      {children}
    </div>
  )
}

export default function Explore() {
  const [draft, setDraft] = useState(EMPTY)
  const [applied, setApplied] = useState(EMPTY)
  const [page, setPage] = useState(0)
  const [pageData, setPageData] = useState({
    content: [],
    totalPages: 1,
    number: 0,
  })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setErr('')
    try {
      const data = await movieApi.listMovies({
        page,
        size: PAGE_SIZE,
        sort: 'createdAt,desc',
        genre: applied.genre || undefined,
        country: applied.country || undefined,
        year: applied.year ? Number(applied.year) : undefined,
        keyword: applied.keyword || undefined,
        kind: applied.kind || undefined,
      })
      setPageData({
        content: data.content || [],
        totalPages: data.totalPages ?? 1,
        number: data.number ?? page,
      })
    } catch (e) {
      setErr(e.response?.data?.message || e.message || 'Lỗi')
    } finally {
      setLoading(false)
    }
  }, [page, applied])

  useEffect(() => {
    document.title = 'Khám phá — VieStream'
  }, [])

  useEffect(() => {
    load().catch(() => {})
  }, [load])

  function patchDraft(k, v) {
    setDraft((prev) => ({ ...prev, [k]: v }))
  }

  function applySearch(ev) {
    ev.preventDefault()
    setApplied({ ...draft })
    setPage(0)
  }

  function clearFilters(ev) {
    ev.preventDefault()
    setDraft(EMPTY)
    setApplied(EMPTY)
    setPage(0)
  }

  const list = pageData.content || []

  const inputCls = 'vie-input-dark vie-autofill-fix'

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-neutral-950 to-zinc-950">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(244,63,94,0.14),transparent)]"
      />
      <div className="relative mx-auto max-w-[1600px] px-5 py-10 sm:px-8 lg:px-12">
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-coral">Thư viện phim</p>
        <h1 className="font-display mt-2 text-4xl font-bold tracking-tight text-white md:text-5xl">Khám phá</h1>
      </header>

      <form
        onSubmit={applySearch}
        className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-brand-panel via-brand-ink/90 to-brand-ink p-6 shadow-xl shadow-black/40 md:p-8"
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Thể loại">
            <input
              placeholder="VD: kinh dị, tình cảm…"
              value={draft.genre}
              onChange={(e) => patchDraft('genre', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Quốc gia">
            <input
              placeholder="VD: Việt Nam, Hàn…"
              value={draft.country}
              onChange={(e) => patchDraft('country', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Năm">
            <input
              type="number"
              placeholder="VD: 2024"
              value={draft.year}
              onChange={(e) => patchDraft('year', e.target.value)}
              className={inputCls}
            />
          </Field>
          <Field label="Loại phim">
            <select value={draft.kind} onChange={(e) => patchDraft('kind', e.target.value)} className={`${inputCls} cursor-pointer`}>
              {MOVIE_KINDS.map((k) => (
                <option key={k || 'any'} value={k}>
                  {k ? (k === 'SINGLE' ? 'Phim lẻ' : 'Phim bộ') : 'Tất cả'}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Từ khóa" className="mt-6">
          <input
            placeholder="Tìm theo tiêu đề hoặc phần mô tả phim…"
            value={draft.keyword}
            onChange={(e) => patchDraft('keyword', e.target.value)}
            className={inputCls}
          />
        </Field>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            type="submit"
            className="inline-flex min-h-[52px] min-w-[200px] flex-1 items-center justify-center gap-2 rounded-xl bg-brand-coral px-8 text-base font-bold text-white shadow-lg shadow-brand-coral/25 transition hover:bg-rose-500 sm:flex-none"
          >
            <svg className="size-5 opacity-95" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Áp dụng tìm kiếm
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex min-h-[52px] items-center justify-center rounded-xl border border-white/18 bg-white/[0.04] px-6 text-base font-semibold text-zinc-300 transition hover:border-white/30 hover:bg-white/[0.08]"
          >
            Xóa bộ lọc
          </button>
          {list.length ? (
            <span className="text-sm text-zinc-500">
              {list.length} phim trong trang này · Trang {(pageData.number ?? page) + 1}/{pageData.totalPages}
            </span>
          ) : null}
        </div>
      </form>

      {err ? (
        <p className="mt-8 rounded-xl border border-red-500/40 bg-red-950/50 px-4 py-3 text-base text-red-200">{err}</p>
      ) : null}

      {/* Vùng kết quả: min-height cố định + giữ danh sách cũ khi đang tải */}
      <div className="relative mt-14 min-h-[720px]">
        {loading && list.length ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex justify-center pt-8">
            <span className="flex items-center gap-2 rounded-full border border-white/15 bg-black/80 px-4 py-2 text-sm font-medium text-zinc-200 shadow-lg backdrop-blur-md">
              <span className="size-2 animate-pulse rounded-full bg-brand-coral" aria-hidden />
              Đang tải danh sách…
            </span>
          </div>
        ) : null}

        <div
          className={`grid grid-cols-2 justify-items-start gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 ${
            loading && list.length ? 'opacity-[0.45] transition-opacity duration-300' : 'opacity-100'
          }`}
        >
          {loading && list.length === 0
            ? [...Array(PAGE_SIZE)].map((_, i) => (
                <div key={`sk-${i}`} className="w-[140px] shrink-0 md:w-[172px]" style={{ minHeight: 280 }}>
                  <div className="aspect-[2/3] animate-pulse rounded-2xl bg-zinc-800/90" />
                </div>
              ))
            : null}

          {!loading || list.length
            ? list.map((m) => (
                <div key={m.id} className="w-[140px] md:w-[172px]">
                  <MovieCard movie={m} />
                </div>
              ))
            : null}

          {loading && list.length === 0 ? null : !list.length && !loading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
              <p className="text-lg text-zinc-500">Không có phim khớp bộ lọc.</p>
              <p className="mt-2 text-sm text-zinc-600">Thử chỉnh từ khóa hoặc bấm &quot;Xóa bộ lọc&quot;.</p>
            </div>
          ) : null}
        </div>
      </div>

      {pageData.totalPages > 1 ? (
        <div className="mt-14 flex flex-wrap items-center justify-center gap-6 border-t border-white/10 pt-10">
          <button
            type="button"
            disabled={page <= 0}
            className="min-h-[48px] min-w-[120px] rounded-xl border border-white/15 px-6 text-base font-semibold text-zinc-200 transition hover:border-brand-coral/50 hover:bg-white/5 disabled:opacity-35"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            ← Trước
          </button>
          <span className="text-base text-zinc-400">
            Trang <strong className="text-white">{page + 1}</strong> / {pageData.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= pageData.totalPages - 1}
            className="min-h-[48px] min-w-[120px] rounded-xl border border-white/15 px-6 text-base font-semibold text-zinc-200 transition hover:border-brand-coral/50 hover:bg-white/5 disabled:opacity-35"
            onClick={() => setPage((p) => p + 1)}
          >
            Sau →
          </button>
        </div>
      ) : null}
      </div>
    </div>
  )
}
