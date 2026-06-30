import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AdminPageShell from '../../components/AdminPageShell.jsx'
import { adminGetMovie, adminPatchMovie } from '../../services/adminApi'
import { adminListTiers } from '../../services/adminVipApi'

export default function AdminMovieEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [movie, setMovie] = useState(null)
  const [tiers, setTiers] = useState([])
  const [form, setForm] = useState({ title: '', overview: '', vipMinTier: 'NONE', deleted: false })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([adminGetMovie(id), adminListTiers()])
      .then(([m, ts]) => {
        setMovie(m)
        setTiers(ts.filter((t) => t.active))
        setForm({
          title: m.title || '',
          overview: m.overview || '',
          vipMinTier: m.vipMinTier || 'NONE',
          deleted: !!m.deleted,
        })
      })
      .catch((e) => setError(e?.message || 'Lỗi tải phim'))
      .finally(() => setLoading(false))
  }, [id])

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await adminPatchMovie(id, form)
      navigate('/quan-tri/phim')
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Lỗi khi cập nhật')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminPageShell eyebrow="Quản trị · Phim" title={`Sửa: ${movie?.title || '...'}`} backTo="/quan-tri/phim">
      {loading ? (
        <p className="text-zinc-400">Đang tải…</p>
      ) : !movie ? (
        <p className="text-red-400">{error || 'Không tìm thấy phim'}</p>
      ) : (
        <>
          <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 text-sm">
            <p className="text-zinc-400">Movie ID: <span className="text-zinc-200">{movie.id}</span> · Kind: <span className="text-zinc-200">{movie.kind}</span></p>
            {movie.kind === 'SERIES' && (
              <Link to={`/quan-tri/phim/${movie.id}/tap`} className="text-brand-coral hover:underline">
                → Quản lý tập phim ({movie.totalEpisodes || 0})
              </Link>
            )}
          </div>

          <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-zinc-300">Tên phim</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-300">VIP Min Tier</label>
              <select
                value={form.vipMinTier}
                onChange={(e) => setForm({ ...form, vipMinTier: e.target.value })}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
              >
                {tiers.map((t) => (
                  <option key={t.code} value={t.code}>{t.displayName} ({t.code})</option>
                ))}
              </select>
            </div>

            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={form.deleted}
                  onChange={(e) => setForm({ ...form, deleted: e.target.checked })}
                />
                Đã xoá (ẩn catalogue)
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-zinc-300">Mô tả</label>
              <textarea
                rows={5}
                value={form.overview}
                onChange={(e) => setForm({ ...form, overview: e.target.value })}
                className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
              />
            </div>

            {error && <p className="md:col-span-2 text-sm text-red-400">{error}</p>}

            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <Link to="/quan-tri/phim" className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800">
                Huỷ
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-brand-coral px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Đang lưu…' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </>
      )}
    </AdminPageShell>
  )
}
