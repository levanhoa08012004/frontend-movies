import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AdminPageShell from '../../components/AdminPageShell.jsx'
import {
  adminCreateEpisode,
  adminCreateEpisodeSource,
  adminDeleteEpisode,
  adminGetMovie,
  adminListEpisodes,
  adminUpdateEpisode,
} from '../../services/adminApi'

export default function AdminEpisodes() {
  const { id: movieId } = useParams()
  const [movie, setMovie] = useState(null)
  const [eps, setEps] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // null | episode obj | 'new'
  const [form, setForm] = useState({
    episodeNumber: '', title: '', slug: '', duration: '',
    serverName: 'Vietsub #1', videoUrl: '', embedUrl: '', aiServer: false,
  })
  const [error, setError] = useState('')

  const reload = () => {
    setLoading(true)
    Promise.all([adminGetMovie(movieId), adminListEpisodes(movieId)])
      .then(([m, list]) => {
        setMovie(m)
        setEps(list)
      })
      .catch((e) => setError(e?.message || 'Lỗi'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { reload() }, [movieId])

  const openCreate = () => {
    setForm({
      episodeNumber: eps.length ? Math.max(...eps.map((e) => e.episodeNumber)) + 1 : 1,
      title: '', slug: '', duration: '',
      serverName: 'Vietsub #1', videoUrl: '', embedUrl: '', aiServer: false,
    })
    setEditing('new')
  }
  const openEdit = (ep) => {
    setForm({
      episodeNumber: ep.episodeNumber,
      title: ep.title || '',
      slug: ep.slug || '',
      duration: ep.duration || '',
      serverName: '', videoUrl: '', embedUrl: '', aiServer: false,
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
      const epNumber = Number(form.episodeNumber)
      if (editing === 'new') {
        await adminCreateEpisode(movieId, epBody)
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
      reload()
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Lỗi lưu')
    }
  }

  const remove = async (ep) => {
    if (!confirm(`Xoá tập ${ep.episodeNumber}? Tất cả nguồn phát của tập này cũng bị xoá.`)) return
    try {
      await adminDeleteEpisode(movieId, ep.episodeNumber)
      reload()
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Lỗi xoá')
    }
  }

  return (
    <AdminPageShell
      eyebrow="Quản trị · Phim · Tập"
      title={`Tập phim: ${movie?.title || ''}`}
      subtitle={movie?.kind === 'SERIES' ? `Tổng ${eps.length} tập` : 'Phim này không phải SERIES'}
      backTo={`/quan-tri/phim/${movieId}`}
    >
      {loading ? (
        <p className="text-zinc-400">Đang tải…</p>
      ) : (
        <>
          {movie?.kind === 'SERIES' && (
            <button
              onClick={openCreate}
              className="mb-4 rounded-md bg-brand-coral px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              + Thêm tập mới
            </button>
          )}
          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 text-left text-zinc-400">
                <tr>
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
                  <tr key={ep.id} className="border-t border-zinc-800">
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
                ))}
                {eps.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-zinc-500">
                      Chưa có tập nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing === 'new' ? 'Thêm tập mới' : `Sửa tập ${editing.episodeNumber}`}>
          <div className="grid gap-4">
            <section>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-500">Thông tin tập</h4>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Số tập *" type="number" value={form.episodeNumber} onChange={(v) => setForm({ ...form, episodeNumber: v })} disabled={editing !== 'new'} />
                <Field label="Thời lượng (giây)" type="number" value={form.duration} onChange={(v) => setForm({ ...form, duration: v })} />
                <Field label="Tiêu đề tập" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
                <Field label="Slug" value={form.slug} onChange={(v) => setForm({ ...form, slug: v })} />
              </div>
            </section>
            {editing === 'new' && (
              <section className="rounded-md border border-amber-500/25 bg-amber-950/10 p-3">
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-200">
                  Nguồn phát đầu tiên (tuỳ chọn)
                </h4>
                <p className="mb-3 text-xs text-zinc-400">
                  Nhập URL ngay để user xem được. Bỏ trống nếu sẽ thêm sau ở trang Nguồn phát.
                </p>
                <div className="grid gap-3">
                  <Field label="Tên server" value={form.serverName} onChange={(v) => setForm({ ...form, serverName: v })} />
                  <Field label="Video URL (m3u8 / HLS)" value={form.videoUrl} onChange={(v) => setForm({ ...form, videoUrl: v })} />
                  <Field label="Embed URL" value={form.embedUrl} onChange={(v) => setForm({ ...form, embedUrl: v })} />
                  <label className="flex items-center gap-2 text-sm text-zinc-300">
                    <input type="checkbox" checked={form.aiServer} onChange={(e) => setForm({ ...form, aiServer: e.target.checked })} />
                    AI server
                  </label>
                </div>
              </section>
            )}
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex justify-end gap-2 border-t border-zinc-800 pt-3">
              <button onClick={() => setEditing(null)} className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-200">Huỷ</button>
              <button onClick={save} className="rounded-md bg-brand-coral px-4 py-2 text-sm font-semibold text-white">Lưu</button>
            </div>
          </div>
        </Modal>
      )}
    </AdminPageShell>
  )
}

function Field({ label, value, onChange, type = 'text', disabled = false }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-zinc-400">{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white disabled:opacity-50"
      />
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-white">{title}</h3>
        {children}
      </div>
    </div>
  )
}
