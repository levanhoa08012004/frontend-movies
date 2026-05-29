import { useState } from 'react'
import AdminPageShell from '../components/AdminPageShell.jsx'
import * as adminApi from '../services/adminApi'

export default function AdminImportCatalog() {
  const [jsonText, setJsonText] = useState('{}')
  const [pathImage, setPathImage] = useState('https://img.ophim.live/uploads/movies/')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(ev) {
    ev.preventDefault()
    setMsg('')
    setLoading(true)
    try {
      const body = JSON.parse(jsonText)
      const movieId = await adminApi.adminImportCatalog(body, pathImage || undefined)
      setMsg(`Import OK — movie id: ${movieId}`)
    } catch (e) {
      setMsg(e.response?.data?.message || e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminPageShell
      backTo="/quan-tri"
      title="Nhập catalog JSON"
      subtitle="Paste JSON khớp DTO máy chủ; kiểm tra kỹ trước khi đưa vào kho."
    >
      <div>
        <label className="mb-3 block text-sm font-bold uppercase tracking-wide text-zinc-500">Tiền tố ảnh (poster)</label>
        <input
          value={pathImage}
          onChange={(e) => setPathImage(e.target.value)}
          className="vie-input-light vie-autofill-light min-h-[54px]"
          placeholder="Base URL poster"
        />
      </div>

      <div className="mt-10">
        <label className="mb-3 block text-sm font-bold uppercase tracking-wide text-zinc-500">Catalog JSON</label>
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          rows={22}
          className="vie-input-light vie-autofill-light min-h-[420px] w-full resize-y p-6 text-[15px] md:text-[16px]"
        />
      </div>

      <button
        type="button"
        disabled={loading}
        onClick={(e) => submit(e)}
        className="mt-10 min-h-[54px] min-w-[200px] rounded-xl bg-brand-coral px-10 text-lg font-bold text-white shadow-lg shadow-brand-coral/20 hover:bg-rose-500 disabled:opacity-50"
      >
        {loading ? 'Đang nhập…' : 'Nhập vào kho'}
      </button>

      {msg ? (
        <pre className="mt-10 whitespace-pre-wrap rounded-2xl border border-white/10 bg-brand-panel p-8 text-[15px] leading-relaxed text-zinc-200 md:text-[16px]">
          {msg}
        </pre>
      ) : null}
    </AdminPageShell>
  )
}
