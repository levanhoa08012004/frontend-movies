import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminPageShell from '../components/AdminPageShell.jsx'
import * as adminApi from '../services/adminApi'
import { VIP_TIERS } from '../constants/backend.js'
import { posterSrc } from '../utils/posterUrl'
import { cleanMovieTitle } from '../utils/movieTitle.js'

const PAGE_SIZE = 20
const EMPTY_FILTER = { genre: '', country: '', year: '', keyword: '', kind: '' }
const VIP_MIN_OPTS = ['NONE', ...VIP_TIERS]
const QUALITY_OPTS = ['', 'CAM', 'SD', 'HD', 'FullHD', '2K', '4K']

const inputCls = 'vie-input-dark vie-autofill-fix vie-datetime-dark'
const filterField = `${inputCls} min-h-[48px]`

// Modal form input: chiều cao đồng nhất h-10 để các field cùng baseline.
const FORM_INPUT =
  'block w-full h-10 rounded-lg border border-white/10 bg-zinc-900/80 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-brand-coral/50 focus:outline-none focus:ring-1 focus:ring-brand-coral/30 disabled:opacity-50'
const FORM_TEXTAREA =
  'block w-full rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-brand-coral/50 focus:outline-none focus:ring-1 focus:ring-brand-coral/30 disabled:opacity-50 resize-y'

const EMPTY_EDIT = {
  title: '',
  overview: '',
  genres: '',
  country: '',
  releaseYear: '',
  director: '',
  cast: '',
  posterPath: '',
  trailerUrl: '',
  videoUrl: '',
  duration: '',
  totalEpisodes: '',
  keywords: '',
  vipMinTier: 'NONE',
  earlyAccessEndsAt: '',
  deleted: false,
}

function Lab({ children, title }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-zinc-500">{title}</label>
      {children}
    </div>
  )
}

function FormField({ label, children, full = false, hint }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-[11px] text-zinc-600">{hint}</p> : null}
    </div>
  )
}

function Modal({ title, subtitle, children, onClose, widthClass = 'max-w-lg' }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/75 px-4 py-10 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`w-full ${widthClass} overflow-hidden rounded-2xl border border-white/12 bg-brand-ink shadow-2xl shadow-black/80`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-6 py-5">
          <div>
            <h3 className="font-display text-xl font-bold text-white">{title}</h3>
            {subtitle ? <p className="mt-1 text-xs text-zinc-500">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-zinc-500 transition hover:bg-white/10 hover:text-white"
            onClick={onClose}
            aria-label="Đóng"
          >
            ✕
          </button>
        </header>
        <div className="px-6 py-6">{children}</div>
      </div>
    </div>
  )
}

function toLocalDateTimeInput(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fmt(v) {
  if (v == null || v === '') return '—'
  if (typeof v === 'number') return v.toLocaleString('vi-VN')
  return String(v)
}

function fmtDate(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('vi-VN')
  } catch {
    return String(iso)
  }
}

export default function AdminMovies() {
  const [draft, setDraft] = useState(EMPTY_FILTER)
  const [applied, setApplied] = useState(EMPTY_FILTER)
  const [page, setPage] = useState(0)
  const [pageData, setPageData] = useState({ content: [], totalPages: 1, number: 0 })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [editMovie, setEditMovie] = useState(null)
  const [editForm, setEditForm] = useState(EMPTY_EDIT)
  const [viewMovie, setViewMovie] = useState(null)
  const [delMovie, setDelMovie] = useState(null)
  const [busy, setBusy] = useState(false)
  const [busyMovieId, setBusyMovieId] = useState(null)
  const [toast, setToast] = useState('')
  const [includeDeletedMovies, setIncludeDeletedMovies] = useState(false)

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
    setDraft(EMPTY_FILTER)
    setApplied(EMPTY_FILTER)
    setPage(0)
  }

  function openEdit(m) {
    setEditMovie(m)
    setEditForm({
      title: m.title || '',
      overview: m.overview || '',
      genres: m.genres || '',
      country: m.country || '',
      releaseYear: m.releaseYear ?? '',
      director: m.director || '',
      cast: m.cast || '',
      posterPath: m.posterPath || '',
      trailerUrl: m.trailerUrl || '',
      videoUrl: m.videoUrl || '',
      duration: m.duration ?? '',
      totalEpisodes: m.totalEpisodes ?? '',
      keywords: m.keywords || '',
      vipMinTier: m.vipMinTier || 'NONE',
      earlyAccessEndsAt: toLocalDateTimeInput(m.earlyAccessEndsAt),
      deleted: !!m.deleted,
    })
  }

  function setField(k, v) {
    setEditForm((f) => ({ ...f, [k]: v }))
  }

  async function saveMovie(ev) {
    ev.preventDefault()
    if (!editMovie) return
    const f = editForm
    if (!f.title.trim()) {
      setToast('Tiêu đề không được trống.')
      window.setTimeout(() => setToast(''), 3000)
      return
    }
    setBusy(true)
    setToast('')
    try {
      const body = {
        title: f.title.trim(),
        overview: f.overview,
        genres: f.genres,
        country: f.country,
        director: f.director,
        cast: f.cast,
        posterPath: f.posterPath,
        trailerUrl: f.trailerUrl,
        videoUrl: f.videoUrl,
        keywords: f.keywords,
        vipMinTier: f.vipMinTier,
      }
      if (f.releaseYear !== '' && f.releaseYear != null) body.releaseYear = Number(f.releaseYear)
      if (f.duration !== '' && f.duration != null) body.duration = Number(f.duration)
      if (f.totalEpisodes !== '' && f.totalEpisodes != null) body.totalEpisodes = Number(f.totalEpisodes)
      if (f.earlyAccessEndsAt) {
        body.earlyAccessEndsAt = new Date(f.earlyAccessEndsAt).toISOString()
      } else if (editMovie.earlyAccessEndsAt) {
        body.clearEarlyAccessEndsAt = true
      }
      if (!!editMovie.deleted !== f.deleted) body.deleted = f.deleted

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
  const th = 'border-b border-white/[0.08] px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-500'
  const td = 'border-t border-white/[0.06] px-4 py-3 align-middle text-sm text-zinc-200'

  return (
    <AdminPageShell
      backTo="/quan-tri"
      title="Kho phim"
      subtitle="Bấm Chi tiết để xem mọi metadata; Sửa để cập nhật tất cả các trường. Phim đã ẩn vẫn còn — bật toggle dưới để hiện lại."
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <a
          href="/quan-tri/phim/moi"
          className="inline-flex items-center gap-1 rounded-md bg-brand-coral px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          + Thêm phim mới
        </a>
        <span className="text-xs text-zinc-500">Tạo phim từ đầu — không qua Ophim import.</span>
      </div>

      {toast ? (
        <p className="mb-6 rounded-xl border border-brand-coral/35 bg-brand-coral/10 px-4 py-3 text-sm text-zinc-200">{toast}</p>
      ) : null}

      <form onSubmit={apply} className="rounded-2xl border border-white/[0.08] bg-brand-panel p-6 md:p-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <Lab title="Thể loại">
            <input className={filterField} value={draft.genre} onChange={(e) => patch('genre', e.target.value)} placeholder="Thể loại" />
          </Lab>
          <Lab title="Quốc gia">
            <input className={filterField} value={draft.country} onChange={(e) => patch('country', e.target.value)} placeholder="Quốc gia" />
          </Lab>
          <Lab title="Năm">
            <input type="number" className={filterField} value={draft.year} onChange={(e) => patch('year', e.target.value)} placeholder="Năm" />
          </Lab>
          <Lab title="Loại">
            <select className={`${filterField} cursor-pointer`} value={draft.kind} onChange={(e) => patch('kind', e.target.value)}>
              <option value="">Tất cả</option>
              <option value="SINGLE">Phim lẻ</option>
              <option value="SERIES">Phim bộ</option>
            </select>
          </Lab>
        </div>
        <div className="mt-8">
          <Lab title="Từ khóa">
            <input className={filterField} value={draft.keyword} onChange={(e) => patch('keyword', e.target.value)} placeholder="Tiêu đề / nội dung" />
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

      <div className="relative mt-10">
        {loading && list.length ? (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center">
            <span className="rounded-full border border-white/15 bg-black/85 px-5 py-2 text-sm text-zinc-200 backdrop-blur">Đang tải…</span>
          </div>
        ) : null}
        <div
          className={`overflow-hidden rounded-2xl border border-white/[0.08] bg-brand-panel shadow-2xl shadow-black/50 ${
            loading && list.length ? 'opacity-60' : ''
          } transition-opacity`}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse">
              <thead className="bg-zinc-900/95">
                <tr>
                  <th className={`${th} w-[88px]`}>Poster</th>
                  <th className={`${th} w-[80px]`}>ID</th>
                  <th className={th}>Tiêu đề</th>
                  <th className={`${th} hidden md:table-cell`}>Loại</th>
                  <th className={`${th} hidden lg:table-cell`}>Năm</th>
                  <th className={`${th} hidden lg:table-cell`}>VIP tối thiểu</th>
                  <th className={th}>Trạng thái</th>
                  <th className={`${th} text-right`}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading && list.length === 0 ? (
                  [...Array(8)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={8} className={`${td} text-center text-zinc-600`}>
                        <span className="inline-block h-4 w-32 animate-pulse rounded bg-zinc-800" />
                      </td>
                    </tr>
                  ))
                ) : list.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={`${td} py-16 text-center text-zinc-500`}>
                      Không có phim.
                    </td>
                  </tr>
                ) : (
                  list.map((m) => {
                    const poster = posterSrc(m.posterPath)
                    const title = cleanMovieTitle(m.title || '')
                    return (
                      <tr key={m.id} className="transition hover:bg-brand-coral/[0.04]">
                        <td className={td}>
                          <button
                            type="button"
                            onClick={() => setViewMovie(m)}
                            className="block h-[72px] w-[48px] overflow-hidden rounded-md bg-zinc-800 ring-1 ring-white/5 transition hover:ring-brand-coral/60"
                            title="Xem chi tiết"
                          >
                            {poster ? (
                              <img src={poster} alt="" loading="lazy" className="h-full w-full object-cover" />
                            ) : (
                              <span className="grid h-full w-full place-items-center text-[10px] text-zinc-600">—</span>
                            )}
                          </button>
                        </td>
                        <td className={`${td} font-mono text-xs text-zinc-500`}>{m.id}</td>
                        <td className={td}>
                          <button
                            type="button"
                            onClick={() => setViewMovie(m)}
                            className="text-left font-semibold text-white transition hover:text-brand-coral"
                            title="Xem chi tiết"
                          >
                            {title || '(không tiêu đề)'}
                          </button>
                          {m.originName && m.originName !== title ? (
                            <p className="mt-0.5 text-[11px] text-zinc-500">{m.originName}</p>
                          ) : null}
                        </td>
                        <td className={`${td} hidden md:table-cell`}>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              m.kind === 'SERIES'
                                ? 'bg-brand-coral/15 text-brand-coral ring-1 ring-brand-coral/30'
                                : 'bg-zinc-800 text-zinc-300 ring-1 ring-zinc-600'
                            }`}
                          >
                            {m.kind === 'SERIES' ? 'Bộ' : 'Lẻ'}
                          </span>
                        </td>
                        <td className={`${td} hidden text-zinc-400 lg:table-cell`}>{m.releaseYear || '—'}</td>
                        <td className={`${td} hidden lg:table-cell`}>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                              !m.vipMinTier || m.vipMinTier === 'NONE'
                                ? 'bg-zinc-800 text-zinc-400'
                                : 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30'
                            }`}
                          >
                            {m.vipMinTier || 'NONE'}
                          </span>
                        </td>
                        <td className={td}>
                          {m.deleted ? (
                            <span className="inline-flex rounded-full bg-red-950/70 px-2.5 py-0.5 text-[11px] font-semibold text-red-200 ring-1 ring-red-500/35">
                              Đã ẩn
                            </span>
                          ) : (
                            <span className="text-xs text-emerald-300">Đang hiển thị</span>
                          )}
                        </td>
                        <td className={`${td} text-right`}>
                          <div className="inline-flex flex-wrap items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setViewMovie(m)}
                              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-brand-coral/40 hover:text-brand-coral"
                            >
                              Chi tiết
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(m)}
                              className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-brand-coral hover:bg-white/5"
                            >
                              Sửa
                            </button>
                            {m.kind === 'SERIES' && (
                              <Link
                                to={`/quan-tri/phim/${m.id}/tap`}
                                className="rounded-lg border border-amber-500/40 bg-amber-950/20 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-950/40"
                              >
                                Tập ({m.totalEpisodes || 0})
                              </Link>
                            )}
                            {m.deleted ? (
                              <button
                                type="button"
                                disabled={busyMovieId === m.id}
                                onClick={() => restoreMovie(m)}
                                className="rounded-lg border border-emerald-500/45 bg-emerald-950/35 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-950/55 disabled:opacity-40"
                              >
                                {busyMovieId === m.id ? '…' : 'Khôi phục'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDelMovie(m)}
                                className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-950/50"
                              >
                                Ẩn
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
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

      {/* ====== POPUP SỬA — full form ====== */}
      {editMovie ? (
        <Modal
          title={`Sửa phim — #${editMovie.id}`}
          subtitle={cleanMovieTitle(editMovie.title || '') || '(chưa có tiêu đề)'}
          onClose={() => !busy && setEditMovie(null)}
          widthClass="max-w-4xl"
        >
          <form onSubmit={saveMovie}>
            <div className="grid gap-x-6 gap-y-8 md:grid-cols-[180px_minmax(0,1fr)]">
              {/* Poster preview cột trái */}
              <div>
                <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
                  {posterSrc(editForm.posterPath || editMovie.posterPath) ? (
                    <img
                      src={posterSrc(editForm.posterPath || editMovie.posterPath)}
                      alt=""
                      className="aspect-[2/3] w-full object-cover"
                    />
                  ) : (
                    <div className="grid aspect-[2/3] w-full place-items-center text-xs text-zinc-600">
                      Chưa có poster
                    </div>
                  )}
                </div>
                <p className="mt-2 text-[11px] text-zinc-500">Preview cập nhật khi đổi URL poster bên phải.</p>
              </div>

              {/* Form sections */}
              <div className="space-y-7">
                {/* SECTION 1: Thông tin chính */}
                <section>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                    Thông tin chính
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Tiêu đề" full>
                      <input
                        className={FORM_INPUT}
                        required
                        value={editForm.title}
                        onChange={(e) => setField('title', e.target.value)}
                      />
                    </FormField>
                    <FormField label="Năm phát hành">
                      <input
                        type="number"
                        className={FORM_INPUT}
                        value={editForm.releaseYear}
                        onChange={(e) => setField('releaseYear', e.target.value)}
                        placeholder="2024"
                      />
                    </FormField>
                    <FormField label="Quốc gia">
                      <input
                        className={FORM_INPUT}
                        value={editForm.country}
                        onChange={(e) => setField('country', e.target.value)}
                        placeholder="Mỹ, Hàn Quốc..."
                      />
                    </FormField>
                    <FormField label="Mô tả / overview" full>
                      <textarea
                        className={FORM_TEXTAREA}
                        rows={4}
                        value={editForm.overview}
                        onChange={(e) => setField('overview', e.target.value)}
                        placeholder="Tóm tắt nội dung phim…"
                      />
                    </FormField>
                  </div>
                </section>

                {/* SECTION 2: Metadata */}
                <section>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                    Metadata
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Thể loại (genres)" full hint="Phân tách bằng dấu phẩy: Hành Động, Khoa Học">
                      <input
                        className={FORM_INPUT}
                        value={editForm.genres}
                        onChange={(e) => setField('genres', e.target.value)}
                        placeholder="Hành Động, Phiêu Lưu"
                      />
                    </FormField>
                    <FormField label="Đạo diễn">
                      <input
                        className={FORM_INPUT}
                        value={editForm.director}
                        onChange={(e) => setField('director', e.target.value)}
                      />
                    </FormField>
                    <FormField label="Diễn viên" hint="Phân tách bằng dấu phẩy">
                      <input
                        className={FORM_INPUT}
                        value={editForm.cast}
                        onChange={(e) => setField('cast', e.target.value)}
                      />
                    </FormField>
                    <FormField label="Thời lượng (phút)">
                      <input
                        type="number"
                        className={FORM_INPUT}
                        value={editForm.duration}
                        onChange={(e) => setField('duration', e.target.value)}
                        placeholder="120"
                      />
                    </FormField>
                    {editMovie.kind === 'SERIES' ? (
                      <FormField label="Tổng số tập">
                        <input
                          type="number"
                          className={FORM_INPUT}
                          value={editForm.totalEpisodes}
                          onChange={(e) => setField('totalEpisodes', e.target.value)}
                        />
                      </FormField>
                    ) : null}
                    <FormField label="Keywords (SEO)" full hint="Phân tách bằng dấu phẩy">
                      <input
                        className={FORM_INPUT}
                        value={editForm.keywords}
                        onChange={(e) => setField('keywords', e.target.value)}
                      />
                    </FormField>
                  </div>
                </section>

                {/* SECTION 3: Media URLs */}
                <section>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                    Media URL
                  </p>
                  <div className="grid gap-4">
                    <FormField label="Poster path / URL">
                      <input
                        className={`${FORM_INPUT} font-mono text-xs`}
                        value={editForm.posterPath}
                        onChange={(e) => setField('posterPath', e.target.value)}
                        placeholder="https://image.tmdb.org/..."
                      />
                    </FormField>
                    <FormField label="Trailer URL (YouTube/embed)">
                      <input
                        className={`${FORM_INPUT} font-mono text-xs`}
                        value={editForm.trailerUrl}
                        onChange={(e) => setField('trailerUrl', e.target.value)}
                      />
                    </FormField>
                    {editMovie.kind === 'SINGLE' ? (
                      <FormField label="Video URL (phim lẻ)" hint="Phim bộ thường để trống — URL theo từng tập">
                        <input
                          className={`${FORM_INPUT} font-mono text-xs`}
                          value={editForm.videoUrl}
                          onChange={(e) => setField('videoUrl', e.target.value)}
                        />
                      </FormField>
                    ) : (
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] px-4 py-3 text-xs text-amber-200">
                        Phim bộ — URL từng tập quản lý ở{' '}
                        <Link
                          to={`/quan-tri/phim/${editMovie.id}/tap`}
                          className="font-bold underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          trang Tập phim
                        </Link>
                        .
                      </div>
                    )}
                  </div>
                </section>

                {/* SECTION 4: VIP + Trạng thái */}
                <section>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                    Quyền truy cập
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="VIP tối thiểu" hint="NONE = ai cũng xem được. Tier cao hơn = yêu cầu gói VIP còn hạn.">
                      <select
                        className={`${FORM_INPUT} cursor-pointer`}
                        value={editForm.vipMinTier}
                        onChange={(e) => setField('vipMinTier', e.target.value)}
                      >
                        {VIP_MIN_OPTS.map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Xem sớm tới (early access)" hint="Trước thời điểm này: chỉ PRIME xem được. Để trống = không có early access.">
                      <input
                        type="datetime-local"
                        className={FORM_INPUT}
                        value={editForm.earlyAccessEndsAt}
                        onChange={(e) => setField('earlyAccessEndsAt', e.target.value)}
                      />
                    </FormField>
                  </div>
                  <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      className="size-4 rounded"
                      checked={editForm.deleted}
                      onChange={(e) => setField('deleted', e.target.checked)}
                    />
                    Ẩn khỏi catalogue công khai (xoá mềm)
                  </label>
                </section>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-white/[0.06] pt-6">
              <Link
                to={`/quan-tri/phim/${editMovie.id}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-zinc-400 transition hover:border-brand-coral/30 hover:text-brand-coral"
                title="Mở trang sửa nâng cao (tab mới)"
              >
                Sửa nâng cao ↗
              </Link>
              <button
                type="button"
                onClick={() => !busy && setEditMovie(null)}
                disabled={busy}
                className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-white/5 disabled:opacity-50"
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-brand-coral px-7 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-coral/25 transition hover:bg-rose-500 disabled:opacity-50"
              >
                {busy ? 'Đang lưu…' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {/* ====== POPUP CHI TIẾT — read-only ====== */}
      {viewMovie ? (
        <Modal
          title={`Chi tiết — #${viewMovie.id}`}
          subtitle={cleanMovieTitle(viewMovie.title || '') || '(chưa có tiêu đề)'}
          onClose={() => setViewMovie(null)}
          widthClass="max-w-4xl"
        >
          <div className="grid gap-x-6 gap-y-8 md:grid-cols-[180px_minmax(0,1fr)]">
            <div>
              <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
                {posterSrc(viewMovie.posterPath) ? (
                  <img src={posterSrc(viewMovie.posterPath)} alt="" className="aspect-[2/3] w-full object-cover" />
                ) : (
                  <div className="grid aspect-[2/3] w-full place-items-center text-xs text-zinc-600">
                    Chưa có poster
                  </div>
                )}
              </div>
              <div className="mt-3 space-y-1.5 text-xs">
                {viewMovie.deleted ? (
                  <span className="inline-flex rounded-full bg-red-950/70 px-2.5 py-0.5 font-semibold text-red-200 ring-1 ring-red-500/35">
                    Đã ẩn
                  </span>
                ) : (
                  <span className="inline-flex rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
                    Đang hiển thị
                  </span>
                )}
                <p className="text-zinc-500">
                  {viewMovie.kind === 'SERIES' ? `Phim bộ · ${viewMovie.totalEpisodes ?? '?'} tập` : 'Phim lẻ'}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <Section title="Thông tin chính">
                <Detail label="Tiêu đề" value={viewMovie.title} />
                <Detail label="Năm" value={viewMovie.releaseYear} />
                <Detail label="Quốc gia" value={viewMovie.country} />
                <Detail label="Thời lượng" value={viewMovie.duration ? `${viewMovie.duration} phút` : null} />
                <Detail label="Mô tả" value={viewMovie.overview} full />
              </Section>

              <Section title="Metadata">
                <Detail label="Thể loại" value={viewMovie.genres} full />
                <Detail label="Đạo diễn" value={viewMovie.director} />
                <Detail label="Diễn viên" value={viewMovie.cast} full />
                <Detail label="Keywords" value={viewMovie.keywords} full />
              </Section>

              <Section title="Quyền truy cập / VIP">
                <Detail
                  label="VIP tối thiểu"
                  value={
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        !viewMovie.vipMinTier || viewMovie.vipMinTier === 'NONE'
                          ? 'bg-zinc-800 text-zinc-400'
                          : 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30'
                      }`}
                    >
                      {viewMovie.vipMinTier || 'NONE'}
                    </span>
                  }
                />
                <Detail label="Early access tới" value={fmtDate(viewMovie.earlyAccessEndsAt)} />
              </Section>

              <Section title="Media URL">
                <Detail label="Poster" value={viewMovie.posterPath} mono full />
                <Detail label="Trailer" value={viewMovie.trailerUrl} mono full />
                <Detail label="Video" value={viewMovie.videoUrl} mono full />
              </Section>

              <Section title="Thống kê">
                <Detail label="Vote average" value={viewMovie.voteAverage} />
                <Detail label="Vote count" value={fmt(viewMovie.voteCount)} />
                <Detail label="Popularity" value={viewMovie.popularity} />
                <Detail label="Score" value={viewMovie.score} />
                <Detail label="Tổng lượt xem" value={fmt(viewMovie.totalViews)} />
                <Detail label="Hôm nay" value={fmt(viewMovie.viewsToday)} />
                <Detail label="Tuần này" value={fmt(viewMovie.viewsWeek)} />
                <Detail label="Tháng này" value={fmt(viewMovie.viewsMonth)} />
              </Section>

              <Section title="Timestamps">
                <Detail label="Tạo lúc" value={fmtDate(viewMovie.createdAt)} />
                <Detail label="Cập nhật lúc" value={fmtDate(viewMovie.updatedAt)} />
              </Section>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-end gap-3 border-t border-white/[0.06] pt-6">
            <Link
              to={`/movies/${viewMovie.id}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-zinc-400 transition hover:border-brand-coral/30 hover:text-brand-coral"
            >
              Mở trang phim user ↗
            </Link>
            <button
              type="button"
              onClick={() => {
                openEdit(viewMovie)
                setViewMovie(null)
              }}
              className="rounded-xl bg-brand-coral px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-coral/25 hover:bg-rose-500"
            >
              Sửa phim này
            </button>
          </div>
        </Modal>
      ) : null}

      {delMovie ? (
        <Modal title="Xác nhận ẩn phim" onClose={() => !busy && setDelMovie(null)} widthClass="max-w-md">
          <p className="text-zinc-300">
            Ẩn <strong className="text-white">{delMovie.title}</strong> (#{delMovie.id}) khỏi catalogue công khai? Dữ liệu
            đánh giá, tập và import vẫn giữ; có thể bật lại trong Sửa hoặc đồng bộ catalog.
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

function Section({ title, children }) {
  return (
    <section>
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{title}</p>
      <dl className="grid gap-x-6 gap-y-3 md:grid-cols-2">{children}</dl>
    </section>
  )
}

function Detail({ label, value, full = false, mono = false }) {
  const isEmpty = value == null || value === '' || (typeof value === 'string' && value.trim() === '')
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{label}</dt>
      <dd
        className={`mt-1 text-sm ${mono ? 'break-all font-mono text-xs' : ''} ${
          isEmpty ? 'text-zinc-600' : 'text-zinc-200'
        }`}
      >
        {isEmpty ? '—' : value}
      </dd>
    </div>
  )
}
