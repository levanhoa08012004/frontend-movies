import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminPageShell from '../../components/AdminPageShell.jsx'
import {
  adminCreateEpisode,
  adminCreateEpisodeSource,
  adminDeleteEpisode,
  adminListEpisodes,
  adminListEpisodeSources,
  adminListMovies,
  adminUpdateEpisode,
} from '../../services/adminApi'

/**
 * Trang quản lý tập phim top-level.
 * - Dropdown filter chọn phim SERIES (search theo tên).
 * - Khi chọn → hiển thị bảng tập + form thêm/sửa/xoá tập inline.
 * - Link "Nguồn phát" mở trang chi tiết nguồn.
 */
export default function AdminEpisodesHub() {
  const [moviesAll, setMoviesAll] = useState([])
  const [loadingMovies, setLoadingMovies] = useState(true)
  const [search, setSearch] = useState('')
  const [movieId, setMovieId] = useState('')
  const [eps, setEps] = useState([])
  const [loadingEps, setLoadingEps] = useState(false)
  const [editing, setEditing] = useState(null) // null | episode | 'new'
  const [form, setForm] = useState({
    episodeNumber: '',
    title: '',
    slug: '',
    duration: '',
    // Source #1 (optional khi tạo — nếu nhập URL sẽ tạo source kèm)
    serverName: 'Vietsub #1',
    videoUrl: '',
    embedUrl: '',
    aiServer: false,
  })
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(null) // episode.id mở source detail
  const [sourcesByEp, setSourcesByEp] = useState({}) // epId → sources[]

  // 1) load tất cả SERIES movies (size lớn 1 phát)
  useEffect(() => {
    setLoadingMovies(true)
    adminListMovies({ size: 500, kind: 'SERIES' })
      .then((page) => setMoviesAll(page?.content || []))
      .catch((e) => setError(e?.message || 'Không tải được danh sách phim'))
      .finally(() => setLoadingMovies(false))
  }, [])

  // 2) khi đổi movie → load episodes
  const reloadEpisodes = (id) => {
    if (!id) {
      setEps([])
      return
    }
    setLoadingEps(true)
    adminListEpisodes(id)
      .then(setEps)
      .catch((e) => setError(e?.message || 'Lỗi tải tập phim'))
      .finally(() => setLoadingEps(false))
  }
  useEffect(() => { reloadEpisodes(movieId) }, [movieId])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return moviesAll
    return moviesAll.filter((m) =>
      (m.title || '').toLowerCase().includes(q) ||
      (m.originName || '').toLowerCase().includes(q) ||
      String(m.id).includes(q))
  }, [search, moviesAll])

  const selectedMovie = useMemo(
    () => moviesAll.find((m) => String(m.id) === String(movieId)) || null,
    [moviesAll, movieId])

  const openCreate = () => {
    setError('')
    setForm({
      episodeNumber: eps.length ? Math.max(...eps.map((e) => e.episodeNumber)) + 1 : 1,
      title: '',
      slug: '',
      duration: '',
      serverName: 'Vietsub #1',
      videoUrl: '',
      embedUrl: '',
      aiServer: false,
    })
    setEditing('new')
  }
  const openEdit = (ep) => {
    setError('')
    setForm({
      episodeNumber: ep.episodeNumber,
      title: ep.title || '',
      slug: ep.slug || '',
      duration: ep.duration || '',
      serverName: '',
      videoUrl: '',
      embedUrl: '',
      aiServer: false,
    })
    setEditing(ep)
  }
  const save = async () => {
    try {
      const epBody = {
        episodeNumber: Number(form.episodeNumber),
        title: form.title || null,
        slug: form.slug || null,
        duration: form.duration ? Number(form.duration) : null,
      }
      let epNumber = Number(form.episodeNumber)
      if (editing === 'new') {
        await adminCreateEpisode(movieId, epBody)
        // Nếu admin nhập videoUrl hoặc embedUrl → tạo source #1 luôn cho tiện
        const hasUrl = (form.videoUrl && form.videoUrl.trim())
          || (form.embedUrl && form.embedUrl.trim())
        if (hasUrl) {
          await adminCreateEpisodeSource(movieId, epNumber, {
            serverName: form.serverName?.trim() || 'Vietsub #1',
            videoUrl: form.videoUrl?.trim() || '',
            embedUrl: form.embedUrl?.trim() || null,
            aiServer: !!form.aiServer,
          })
        }
      } else {
        await adminUpdateEpisode(movieId, editing.episodeNumber, epBody)
      }
      setEditing(null)
      reloadEpisodes(movieId)
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Lỗi lưu')
    }
  }

  const toggleExpand = async (ep) => {
    if (expanded === ep.id) {
      setExpanded(null)
      return
    }
    setExpanded(ep.id)
    if (!sourcesByEp[ep.id]) {
      try {
        const list = await adminListEpisodeSources(movieId, ep.episodeNumber)
        setSourcesByEp((s) => ({ ...s, [ep.id]: list }))
      } catch (e) {
        setError(e?.message || 'Lỗi tải nguồn')
      }
    }
  }
  const remove = async (ep) => {
    if (!confirm(`Xoá tập ${ep.episodeNumber}? Mọi nguồn phát của tập này cũng bị xoá.`)) return
    try {
      await adminDeleteEpisode(movieId, ep.episodeNumber)
      reloadEpisodes(movieId)
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Lỗi xoá')
    }
  }

  return (
    <AdminPageShell
      eyebrow="Quản trị · Tập phim"
      title="Quản lý tập phim"
      subtitle="Chọn phim SERIES từ danh sách để xem & thêm tập"
      backTo="/quan-tri"
    >
      {/* Movie picker */}
      <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <label className="mb-2 block text-sm font-medium text-zinc-300">Phim (chỉ SERIES)</label>
        <div className="grid gap-3 md:grid-cols-[1fr_2fr]">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên hoặc ID…"
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
          />
          <select
            value={movieId}
            onChange={(e) => setMovieId(e.target.value)}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
            disabled={loadingMovies}
          >
            <option value="">{loadingMovies ? 'Đang tải…' : `— Chọn phim (${filtered.length}/${moviesAll.length}) —`}</option>
            {filtered.map((m) => (
              <option key={m.id} value={m.id}>
                #{m.id} · {m.title}{m.releaseYear ? ` (${m.releaseYear})` : ''}
                {m.totalEpisodes ? ` · ${m.totalEpisodes} tập` : ''}
              </option>
            ))}
          </select>
        </div>
        {selectedMovie && (
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
            <span>Tổng tập DB: <span className="text-zinc-200">{selectedMovie.totalEpisodes || 0}</span></span>
            <span>·</span>
            <span>Đã thêm: <span className="text-zinc-200">{eps.length}</span></span>
            <Link
              to={`/quan-tri/phim/${selectedMovie.id}`}
              className="ml-auto text-brand-coral hover:underline"
            >
              → Sửa metadata phim
            </Link>
          </div>
        )}
      </div>

      {/* Episodes table */}
      {!movieId ? (
        <p className="rounded-xl border border-zinc-800 bg-zinc-900/20 px-4 py-8 text-center text-zinc-500">
          Chọn phim ở trên để xem & thêm tập.
        </p>
      ) : loadingEps ? (
        <p className="text-zinc-400">Đang tải tập…</p>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-zinc-100">
              Tập phim: {selectedMovie?.title}
            </h3>
            <button
              onClick={openCreate}
              className="rounded-md bg-brand-coral px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              + Thêm tập mới
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 text-left text-zinc-400">
                <tr>
                  <th className="w-8 px-2 py-2"></th>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Tiêu đề</th>
                  <th className="px-3 py-2">Slug</th>
                  <th className="px-3 py-2">Thời lượng</th>
                  <th className="px-3 py-2">Số nguồn</th>
                  <th className="px-3 py-2 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {eps.map((ep) => (
                  <Fragment key={ep.id}>
                    <tr className="border-t border-zinc-800">
                      <td className="px-2 py-2 text-center">
                        <button
                          onClick={() => toggleExpand(ep)}
                          className="text-zinc-500 hover:text-brand-coral"
                          title="Xem nguồn phát"
                        >
                          {expanded === ep.id ? '▾' : '▸'}
                        </button>
                      </td>
                      <td className="px-3 py-2 font-mono text-zinc-200">{ep.episodeNumber}</td>
                      <td className="px-3 py-2 text-zinc-200">{ep.title || <i className="text-zinc-500">—</i>}</td>
                      <td className="px-3 py-2 text-zinc-400">{ep.slug || '—'}</td>
                      <td className="px-3 py-2 text-zinc-400">{ep.duration ? `${ep.duration}s` : '—'}</td>
                      <td className="px-3 py-2 text-zinc-400">{ep.sourceCount || 0}</td>
                      <td className="px-3 py-2 text-right">
                        <Link
                          to={`/quan-tri/phim/${movieId}/tap/${ep.episodeNumber}/nguon`}
                          className="mr-3 text-brand-coral hover:underline"
                        >
                          Nguồn phát
                        </Link>
                        <button onClick={() => openEdit(ep)} className="mr-2 text-zinc-300 hover:text-white">
                          Sửa
                        </button>
                        <button onClick={() => remove(ep)} className="text-red-400 hover:text-red-300">
                          Xoá
                        </button>
                      </td>
                    </tr>
                    {expanded === ep.id && (
                      <tr className="bg-zinc-900/40">
                        <td></td>
                        <td colSpan={6} className="px-4 py-3">
                          <div className="mb-2 flex items-center justify-between">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                              Nguồn phát của tập {ep.episodeNumber}
                            </h4>
                            <Link
                              to={`/quan-tri/phim/${movieId}/tap/${ep.episodeNumber}/nguon`}
                              className="text-xs text-brand-coral hover:underline"
                            >
                              + Thêm / quản lý đầy đủ →
                            </Link>
                          </div>
                          {!sourcesByEp[ep.id] ? (
                            <p className="text-xs text-zinc-500">Đang tải…</p>
                          ) : sourcesByEp[ep.id].length === 0 ? (
                            <p className="rounded border border-amber-500/30 bg-amber-950/20 px-3 py-2 text-xs text-amber-200">
                              Tập này chưa có nguồn phát nào — user xem sẽ thấy "Không có video".
                            </p>
                          ) : (
                            <ul className="divide-y divide-zinc-800 text-xs">
                              {sourcesByEp[ep.id].map((s) => (
                                <li key={s.id} className="grid grid-cols-[120px_1fr_1fr_40px] gap-3 py-2">
                                  <span className="font-semibold text-zinc-200">{s.serverName}</span>
                                  <span className="truncate text-zinc-400 font-mono" title={s.videoUrl}>
                                    {s.videoUrl || <i className="text-zinc-600">— không m3u8 —</i>}
                                  </span>
                                  <span className="truncate text-zinc-400 font-mono" title={s.embedUrl}>
                                    {s.embedUrl || <i className="text-zinc-600">— không embed —</i>}
                                  </span>
                                  <span className="text-center text-zinc-500">{s.aiServer ? 'AI' : ''}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
                {eps.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-zinc-500">
                      Chưa có tập nào. Bấm "+ Thêm tập mới" để bắt đầu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal Create/Edit */}
      {editing && (
        <Modal
          onClose={() => setEditing(null)}
          title={editing === 'new' ? 'Thêm tập mới' : `Sửa tập ${editing.episodeNumber}`}
        >
          <div className="grid gap-4">
            <section>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Thông tin tập</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Số tập *"
                  type="number"
                  value={form.episodeNumber}
                  onChange={(v) => setForm({ ...form, episodeNumber: v })}
                  disabled={editing !== 'new'}
                />
                <Field
                  label="Thời lượng (giây)"
                  type="number"
                  value={form.duration}
                  onChange={(v) => setForm({ ...form, duration: v })}
                  placeholder="vd 1800"
                />
                <Field
                  label="Tiêu đề tập"
                  value={form.title}
                  onChange={(v) => setForm({ ...form, title: v })}
                  placeholder='vd "Khởi đầu"'
                />
                <Field
                  label="Slug (URL-safe)"
                  value={form.slug}
                  onChange={(v) => setForm({ ...form, slug: v })}
                  placeholder="tap-1"
                />
              </div>
            </section>

            {editing === 'new' && (
              <section className="rounded-md border border-amber-500/25 bg-amber-950/10 p-3">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-200">
                  Nguồn phát đầu tiên (tuỳ chọn)
                </h4>
                <p className="mb-3 text-xs text-zinc-400">
                  Nhập URL ngay để user xem được luôn. Bỏ trống nếu sẽ thêm sau ở trang Nguồn phát.
                  Có thể thêm nhiều server (Vietsub #2, Dub, …) sau khi tạo xong tập.
                </p>
                <div className="grid gap-3">
                  <Field
                    label="Tên server"
                    value={form.serverName}
                    onChange={(v) => setForm({ ...form, serverName: v })}
                    placeholder="Vietsub #1 / Dub / RAW"
                  />
                  <Field
                    label="Video URL (m3u8 / HLS)"
                    value={form.videoUrl}
                    onChange={(v) => setForm({ ...form, videoUrl: v })}
                    placeholder="https://.../master.m3u8"
                  />
                  <Field
                    label="Embed URL (iframe player)"
                    value={form.embedUrl}
                    onChange={(v) => setForm({ ...form, embedUrl: v })}
                    placeholder="https://player.example.com/..."
                  />
                  <label className="flex items-center gap-2 text-sm text-zinc-300">
                    <input
                      type="checkbox"
                      checked={form.aiServer}
                      onChange={(e) => setForm({ ...form, aiServer: e.target.checked })}
                    />
                    AI server (lồng tiếng AI / sub AI)
                  </label>
                </div>
              </section>
            )}

            {editing !== 'new' && (
              <p className="rounded-md border border-zinc-700 bg-zinc-900/40 p-3 text-xs text-zinc-400">
                Để sửa nguồn phát (videoUrl / embedUrl / server) → mở rộng row tập hoặc bấm
                "Nguồn phát" trên row đó.
              </p>
            )}

            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex justify-end gap-2 border-t border-zinc-800 pt-3">
              <button
                onClick={() => setEditing(null)}
                className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-200"
              >
                Huỷ
              </button>
              <button
                onClick={save}
                className="rounded-md bg-brand-coral px-4 py-2 text-sm font-semibold text-white"
              >
                Lưu
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AdminPageShell>
  )
}

function Field({ label, value, onChange, type = 'text', disabled = false, placeholder }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-zinc-400">{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-50"
      />
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl"
      >
        <h3 className="mb-4 text-lg font-semibold text-white">{title}</h3>
        {children}
      </div>
    </div>
  )
}
