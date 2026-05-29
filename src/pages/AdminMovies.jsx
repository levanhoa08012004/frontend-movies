import { useCallback, useEffect, useState } from 'react'
import AdminPageShell from '../components/AdminPageShell.jsx'
import MovieCard from '../components/MovieCard.jsx'
import * as adminApi from '../services/adminApi'
import { VIP_TIERS } from '../constants/backend.js'

const PAGE_SIZE = 18
const EMPTY = { genre: '', country: '', year: '', keyword: '', kind: '' }
const VIP_MIN_OPTS = ['NONE', ...VIP_TIERS]

const inputCls = 'vie-input-dark vie-autofill-fix vie-datetime-dark'
const field = `${inputCls} min-h-[48px]`

function Lab({ children, title }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-500">{title}</label>
      {children}
    </div>
  )
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/12 bg-brand-ink p-6 shadow-2xl">
        <div className="mb-4 flex justify-between gap-4">
          <h3 className="font-display text-xl font-bold text-white">{title}</h3>
          <button type="button" className="text-zinc-500 hover:text-white" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function AdminMovies() {
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
  const [editMovie, setEditMovie] = useState(null)
  const [delMovie, setDelMovie] = useState(null)
  const [busy, setBusy] = useState(false)
  const [busyMovieId, setBusyMovieId] = useState(null)
  const [toast, setToast] = useState('')
  const [includeDeletedMovies, setIncludeDeletedMovies] = useState(false)

  const [mTitle, setMTitle] = useState('')
  const [mOverview, setMOverview] = useState('')
  const [mVip, setMVip] = useState('NONE')
  const [mHidden, setMHidden] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setErr('')
    try {
      const data = await adminApi.adminListMovies({
        page,
        size: PAGE_SIZE,
        sort: 'createdAt,desc',
        genre: applied.genre || undefined,
        country: applied.country || undefined,
        year: applied.year ? Number(applied.year) : undefined,
        keyword: applied.keyword || undefined,
        kind: applied.kind || undefined,
        includeDeleted: includeDeletedMovies || undefined,
      })
      setPageData({
        content: data.content || [],
        totalPages: data.totalPages ?? 1,
        number: data.number ?? page,
      })
    } catch (e) {
      setErr(e.response?.data?.message || e.message || 'Không tải được.')
    } finally {
      setLoading(false)
    }
  }, [page, applied, includeDeletedMovies])

  useEffect(() => {
    document.title = 'Quản trị — Kho phim'
  }, [])

  useEffect(() => {
    load().catch(() => {})
  }, [load])

  useEffect(() => {
    setPage(0)
  }, [includeDeletedMovies])

  function patch(k, v) {
    setDraft((p) => ({ ...p, [k]: v }))
  }

  function apply(ev) {
    ev.preventDefault()
    setApplied({ ...draft })
    setPage(0)
  }

  function clear(ev) {
    ev.preventDefault()
    setDraft(EMPTY)
    setApplied(EMPTY)
    setPage(0)
  }

  function openEdit(m) {
    setEditMovie(m)
    setMTitle(m.title || '')
    setMOverview(m.overview || '')
    setMVip(m.vipMinTier || 'NONE')
    setMHidden(!!m.deleted)
  }

  async function saveMovie(ev) {
    ev.preventDefault()
    if (!editMovie) return
    setBusy(true)
    setToast('')
    try {
      const body = {
        title: mTitle.trim(),
        overview: mOverview,
        vipMinTier: mVip,
      }
      if (!!editMovie.deleted !== mHidden) {
        body.deleted = mHidden
      }
      await adminApi.adminPatchMovie(editMovie.id, body)
      setToast('Đã cập nhật phim.')
      setEditMovie(null)
      await load().catch(() => {})
    } catch (e) {
      setToast(e.response?.data?.message || e.message || 'Lỗi')
    } finally {
      setBusy(false)
      window.setTimeout(() => setToast(''), 4000)
    }
  }

  async function confirmDelete(ev) {
    ev.preventDefault()
    if (!delMovie) return
    setBusy(true)
    try {
      await adminApi.adminDeleteMovie(delMovie.id)
      setToast(`Đã ẩn phim #${delMovie.id} (xóa mềm).`)
      setDelMovie(null)
      await load().catch(() => {})
    } catch (e) {
      setToast(e.response?.data?.message || e.message || 'Không xóa được.')
    } finally {
      setBusy(false)
      window.setTimeout(() => setToast(''), 5000)
    }
  }

  async function restoreMovie(m) {
    setBusyMovieId(m.id)
    setToast('')
    try {
      await adminApi.adminPatchMovie(m.id, { deleted: false })
      setToast(`Đã khôi phục hiển thị phim #${m.id}.`)
      await load().catch(() => {})
    } catch (e) {
      setToast(e.response?.data?.message || e.message || 'Không khôi phục được.')
    } finally {
      setBusyMovieId(null)
      window.setTimeout(() => setToast(''), 5000)
    }
  }

  const list = pageData.content || []

  return (
    <AdminPageShell
      backTo="/quan-tri"
      title="Kho phim"
      subtitle="Thẻ phim đã ẩn luôn có nút Khôi phục. Bật “Hiện cả phim đã ẩn” để tìm và bật lại catalogue. Lọc chỉ áp khi bấm Áp dụng."
    >
      {toast ? (
        <p className="mb-6 rounded-xl border border-brand-coral/35 bg-brand-coral/10 px-4 py-3 text-sm text-zinc-200">{toast}</p>
      ) : null}

      <form onSubmit={apply} className="rounded-2xl border border-white/[0.08] bg-brand-panel p-6 md:p-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <Lab title="Thể loại">
            <input className={field} value={draft.genre} onChange={(e) => patch('genre', e.target.value)} placeholder="Thể loại" />
          </Lab>
          <Lab title="Quốc gia">
            <input className={field} value={draft.country} onChange={(e) => patch('country', e.target.value)} placeholder="Quốc gia" />
          </Lab>
          <Lab title="Năm">
            <input type="number" className={field} value={draft.year} onChange={(e) => patch('year', e.target.value)} placeholder="Năm" />
          </Lab>
          <Lab title="Loại">
            <select className={`${field} cursor-pointer`} value={draft.kind} onChange={(e) => patch('kind', e.target.value)}>
              <option value="">Tất cả</option>
              <option value="SINGLE">Phim lẻ</option>
              <option value="SERIES">Phim bộ</option>
            </select>
          </Lab>
        </div>
        <div className="mt-8">
          <Lab title="Từ khóa">
            <input className={field} value={draft.keyword} onChange={(e) => patch('keyword', e.target.value)} placeholder="Tiêu đề / nội dung" />
          </Lab>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <button
            type="submit"
            className="min-h-[52px] min-w-[200px] rounded-xl bg-brand-coral px-10 text-lg font-bold text-white shadow-lg shadow-brand-coral/20 hover:bg-rose-500"
          >
            Áp dụng bộ lọc
          </button>
          <button type="button" onClick={clear} className="min-h-[52px] rounded-xl border border-white/15 px-8 text-lg font-semibold text-zinc-300 hover:bg-white/5">
            Xóa lọc
          </button>
        </div>
        <label className="mt-6 flex cursor-pointer items-center gap-3 text-sm text-zinc-400">
          <input
            type="checkbox"
            className="size-4 rounded border-white/20"
            checked={includeDeletedMovies}
            onChange={(e) => setIncludeDeletedMovies(e.target.checked)}
          />
          Hiện cả phim đã ẩn (xóa mềm)
        </label>
      </form>

      {err ? (
        <p className="mt-8 rounded-2xl border border-red-500/40 bg-red-950/50 px-5 py-4 text-lg text-red-100">{err}</p>
      ) : null}

      <div className="relative mt-12 min-h-[720px]">
        {loading && list.length ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex justify-center pt-8">
            <span className="rounded-full border border-white/15 bg-black/85 px-5 py-2.5 text-base text-zinc-200 backdrop-blur">Đang tải…</span>
          </div>
        ) : null}
        <div
          className={`grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 ${
            loading && list.length ? 'opacity-[0.45]' : ''
          } transition-opacity`}
        >
          {loading && list.length === 0
            ? [...Array(PAGE_SIZE)].map((_, i) => (
                <div key={i} style={{ maxWidth: 172 }}>
                  <div className="aspect-[2/3] animate-pulse rounded-2xl bg-zinc-800" />
                </div>
              ))
            : null}
          {list.map((m) => (
            <div key={m.id} className="group relative" style={{ maxWidth: 172 }}>
              {m.deleted ? (
                <span className="absolute left-1 top-1 z-20 rounded bg-red-900/90 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-100">
                  Đã ẩn
                </span>
              ) : null}
              <div
                className={`absolute -top-1 right-0 z-20 flex flex-wrap justify-end gap-1 transition ${
                  m.deleted ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
                }`}
              >
                <button
                  type="button"
                  className="rounded-lg border border-white/15 bg-black/85 px-2 py-1 text-[11px] font-bold text-brand-coral"
                  onClick={() => openEdit(m)}
                >
                  Sửa
                </button>
                {m.deleted ? (
                  <button
                    type="button"
                    disabled={busyMovieId === m.id}
                    className="rounded-lg border border-emerald-500/50 bg-emerald-950/90 px-2 py-1 text-[11px] font-bold text-emerald-100 disabled:opacity-50"
                    onClick={() => restoreMovie(m)}
                  >
                    {busyMovieId === m.id ? '…' : 'Khôi phục'}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rounded-lg border border-red-500/40 bg-black/85 px-2 py-1 text-[11px] font-bold text-red-300"
                    onClick={() => setDelMovie(m)}
                  >
                    Ẩn
                  </button>
                )}
              </div>
              <MovieCard movie={m} />
            </div>
          ))}
          {!loading && list.length === 0 ? (
            <div className="col-span-full py-24 text-center text-lg text-zinc-500">Không có phim.</div>
          ) : null}
        </div>
      </div>

      {pageData.totalPages > 1 ? (
        <div className="mt-14 flex justify-center gap-8 border-t border-white/10 pt-10">
          <button
            type="button"
            disabled={page <= 0}
            className="min-h-[52px] min-w-[120px] rounded-xl border border-white/15 px-6 text-lg font-semibold hover:bg-white/5 disabled:opacity-40"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            ← Trước
          </button>
          <span className="flex items-center text-lg text-zinc-400">
            {(pageData.number ?? page) + 1} / {pageData.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= pageData.totalPages - 1}
            className="min-h-[52px] min-w-[120px] rounded-xl border border-white/15 px-6 text-lg font-semibold hover:bg-white/5 disabled:opacity-40"
            onClick={() => setPage((p) => p + 1)}
          >
            Sau →
          </button>
        </div>
      ) : null}

      {editMovie ? (
        <Modal title={`Sửa — ID ${editMovie.id}`} onClose={() => !busy && setEditMovie(null)}>
          <form onSubmit={saveMovie} className="space-y-4">
            <Lab title="Tiêu đề">
              <input className={field} required value={mTitle} onChange={(e) => setMTitle(e.target.value)} />
            </Lab>
            <Lab title="Mô tả / overview">
              <textarea className={`${field} min-h-[140px] resize-y`} value={mOverview} onChange={(e) => setMOverview(e.target.value)} />
            </Lab>
            <Lab title="VIP tối thiểu">
              <select className={`${field} cursor-pointer`} value={mVip} onChange={(e) => setMVip(e.target.value)}>
                {VIP_MIN_OPTS.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </Lab>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" className="size-4 rounded" checked={mHidden} onChange={(e) => setMHidden(e.target.checked)} />
              Ẩn khỏi kho công khai (xóa mềm)
            </label>
            <button type="submit" disabled={busy} className="w-full rounded-xl bg-brand-coral py-3 font-bold text-white disabled:opacity-50">
              {busy ? 'Đang lưu…' : 'Lưu'}
            </button>
          </form>
        </Modal>
      ) : null}

      {delMovie ? (
        <Modal title="Xác nhận ẩn phim" onClose={() => !busy && setDelMovie(null)}>
          <p className="text-zinc-300">
            Ẩn <strong className="text-white">{delMovie.title}</strong> (#{delMovie.id}) khỏi catalogue công khai? Dữ liệu đánh giá, tập và import vẫn
            giữ; có thể bật lại trong Sửa hoặc đồng bộ catalog.
          </p>
          <div className="mt-8 flex gap-4">
            <button type="button" className="flex-1 rounded-xl border border-white/15 py-3 font-semibold" onClick={() => setDelMovie(null)}>
              Huỷ
            </button>
            <button
              type="button"
              disabled={busy}
              className="flex-1 rounded-xl bg-red-600 py-3 font-bold text-white disabled:opacity-50"
              onClick={(e) => confirmDelete(e)}
            >
              {busy ? '…' : 'Xóa'}
            </button>
          </div>
        </Modal>
      ) : null}
    </AdminPageShell>
  )
}
