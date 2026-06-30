import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import AdminPageShell from '../../components/AdminPageShell.jsx'
import {
  adminCreateEpisodeSource,
  adminDeleteEpisodeSource,
  adminListEpisodeSources,
  adminUpdateEpisodeSource,
} from '../../services/adminApi'

export default function AdminEpisodeSources() {
  const { id: movieId, ep } = useParams()
  const episodeNumber = Number(ep)
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // null | source obj | 'new'
  const [form, setForm] = useState({ serverName: '', videoUrl: '', embedUrl: '', aiServer: false })
  const [error, setError] = useState('')

  const reload = () => {
    setLoading(true)
    adminListEpisodeSources(movieId, episodeNumber)
      .then(setSources)
      .catch((e) => setError(e?.message || 'Lỗi'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { reload() }, [movieId, episodeNumber])

  const openCreate = () => {
    setForm({ serverName: '', videoUrl: '', embedUrl: '', aiServer: false })
    setEditing('new')
  }
  const openEdit = (s) => {
    setForm({
      serverName: s.serverName || '',
      videoUrl: s.videoUrl || '',
      embedUrl: s.embedUrl || '',
      aiServer: !!s.aiServer,
    })
    setEditing(s)
  }

  const save = async () => {
    try {
      if (editing === 'new') {
        await adminCreateEpisodeSource(movieId, episodeNumber, form)
      } else {
        await adminUpdateEpisodeSource(movieId, episodeNumber, editing.id, form)
      }
      setEditing(null)
      reload()
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Lỗi lưu')
    }
  }

  const remove = async (s) => {
    if (!confirm(`Xoá nguồn "${s.serverName}"?`)) return
    try {
      await adminDeleteEpisodeSource(movieId, episodeNumber, s.id)
      reload()
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Lỗi xoá')
    }
  }

  return (
    <AdminPageShell
      eyebrow={`Quản trị · Phim · Tập ${episodeNumber}`}
      title="Nguồn phát"
      subtitle={`${sources.length} nguồn (m3u8 / embed)`}
      backTo={`/quan-tri/phim/${movieId}/tap`}
    >
      {loading ? (
        <p className="text-zinc-400">Đang tải…</p>
      ) : (
        <>
          <button
            onClick={openCreate}
            className="mb-4 rounded-md bg-brand-coral px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            + Thêm nguồn mới
          </button>
          <div className="overflow-x-auto rounded-lg border border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900 text-left text-zinc-400">
                <tr>
                  <th className="px-3 py-2">Server</th>
                  <th className="px-3 py-2">Video URL (m3u8)</th>
                  <th className="px-3 py-2">Embed URL</th>
                  <th className="px-3 py-2">AI?</th>
                  <th className="px-3 py-2 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.id} className="border-t border-zinc-800">
                    <td className="px-3 py-2 font-medium text-zinc-200">{s.serverName}</td>
                    <td className="px-3 py-2 max-w-xs truncate text-zinc-400" title={s.videoUrl}>{s.videoUrl || '—'}</td>
                    <td className="px-3 py-2 max-w-xs truncate text-zinc-400" title={s.embedUrl}>{s.embedUrl || '—'}</td>
                    <td className="px-3 py-2">{s.aiServer ? '✓' : ''}</td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => openEdit(s)} className="mr-2 text-zinc-300 hover:text-white">Sửa</button>
                      <button onClick={() => remove(s)} className="text-red-400 hover:text-red-300">Xoá</button>
                    </td>
                  </tr>
                ))}
                {sources.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-zinc-500">
                      Chưa có nguồn phát nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editing && (
        <Modal onClose={() => setEditing(null)} title={editing === 'new' ? 'Thêm nguồn phát' : 'Sửa nguồn'}>
          <div className="grid gap-3">
            <Field label="Tên server" value={form.serverName} onChange={(v) => setForm({ ...form, serverName: v })} placeholder="Vietsub #1 / Dub / RAW" />
            <Field label="Video URL (m3u8)" value={form.videoUrl} onChange={(v) => setForm({ ...form, videoUrl: v })} placeholder="https://.../master.m3u8" />
            <Field label="Embed URL" value={form.embedUrl} onChange={(v) => setForm({ ...form, embedUrl: v })} placeholder="https://player..." />
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={form.aiServer} onChange={(e) => setForm({ ...form, aiServer: e.target.checked })} />
              AI server (lồng tiếng AI / sub AI)
            </label>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditing(null)} className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-200">Huỷ</button>
              <button onClick={save} className="rounded-md bg-brand-coral px-4 py-2 text-sm font-semibold text-white">Lưu</button>
            </div>
          </div>
        </Modal>
      )}
    </AdminPageShell>
  )
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-zinc-400">{label}</label>
      <input
        type="text"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
      />
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-white">{title}</h3>
        {children}
      </div>
    </div>
  )
}
