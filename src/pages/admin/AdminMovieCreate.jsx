import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AdminPageShell from '../../components/AdminPageShell.jsx'
import { adminCreateMovie } from '../../services/adminApi'
import { adminListTiers } from '../../services/adminVipApi'

const KIND_OPTIONS = ['SINGLE', 'SERIES']

export default function AdminMovieCreate() {
  const navigate = useNavigate()
  const [tiers, setTiers] = useState([])
  const [form, setForm] = useState({
    title: '',
    originName: '',
    kind: 'SINGLE',
    overview: '',
    posterPath: '',
    thumbUrl: '',
    trailerUrl: '',
    videoUrl: '',
    vipMinTier: 'NONE',
    releaseYear: '',
    country: '',
    genres: '',
    cast: '',
    director: '',
    duration: '',
    totalEpisodes: '',
    quality: '',
    keywords: '',
    notifyText: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    adminListTiers().then((rs) => setTiers(rs.filter((t) => t.active))).catch(() => setTiers([]))
  }, [])

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) {
      setError('Tên phim không được trống')
      return
    }
    setSaving(true)
    setError('')
    try {
      const body = {
        ...form,
        releaseYear: form.releaseYear ? Number(form.releaseYear) : null,
        duration: form.duration ? Number(form.duration) : null,
        totalEpisodes: form.totalEpisodes ? Number(form.totalEpisodes) : null,
      }
      // SERIES không cần videoUrl ở Movie (dùng EpisodeSource); SINGLE thì cần
      if (body.kind === 'SERIES') body.videoUrl = ''
      const m = await adminCreateMovie(body)
      if (m.kind === 'SERIES') {
        // SERIES → mở thẳng trang quản lý tập để admin thêm tập ngay
        navigate(`/quan-tri/phim/${m.id}/tap`)
      } else {
        navigate(`/quan-tri/phim/${m.id}`)
      }
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Lỗi khi tạo phim')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminPageShell eyebrow="Quản trị · Phim" title="Thêm phim mới" subtitle="Tạo phim từ đầu (không qua Ophim import)" backTo="/quan-tri/phim">
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <Field label="Tên phim *" value={form.title} onChange={(v) => set('title', v)} required />
        <Field label="Tên gốc" value={form.originName} onChange={(v) => set('originName', v)} />

        <Select label="Loại phim *" value={form.kind} onChange={(v) => set('kind', v)} options={KIND_OPTIONS} />
        <Select
          label="Gói VIP tối thiểu"
          value={form.vipMinTier}
          onChange={(v) => set('vipMinTier', v)}
          options={tiers.map((t) => t.code)}
        />

        <Field label="Năm phát hành" type="number" value={form.releaseYear} onChange={(v) => set('releaseYear', v)} />
        <Field label="Quốc gia" value={form.country} onChange={(v) => set('country', v)} />

        <Field label="Thể loại (phẩy)" value={form.genres} onChange={(v) => set('genres', v)} />
        <Field label="Từ khoá" value={form.keywords} onChange={(v) => set('keywords', v)} />

        <Field label="Đạo diễn" value={form.director} onChange={(v) => set('director', v)} />
        <Field label="Diễn viên" value={form.cast} onChange={(v) => set('cast', v)} />

        <Field label="Poster URL" value={form.posterPath} onChange={(v) => set('posterPath', v)} />
        <Field label="Thumbnail URL" value={form.thumbUrl} onChange={(v) => set('thumbUrl', v)} />

        <Field label="Trailer URL" value={form.trailerUrl} onChange={(v) => set('trailerUrl', v)} />
        {form.kind === 'SINGLE' && (
          <Field label="Video URL (phim lẻ)" value={form.videoUrl} onChange={(v) => set('videoUrl', v)} />
        )}

        <Field label="Thời lượng (giây)" type="number" value={form.duration} onChange={(v) => set('duration', v)} />
        {form.kind === 'SERIES' && (
          <Field label="Tổng số tập" type="number" value={form.totalEpisodes} onChange={(v) => set('totalEpisodes', v)} />
        )}

        <Field label="Quality (HD/FHD/4K)" value={form.quality} onChange={(v) => set('quality', v)} />
        <Field label="Notify text" value={form.notifyText} onChange={(v) => set('notifyText', v)} />

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-zinc-300">Mô tả</label>
          <textarea
            value={form.overview}
            onChange={(e) => set('overview', e.target.value)}
            rows={4}
            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
          />
        </div>

        {error && <p className="md:col-span-2 text-sm text-red-400">{error}</p>}

        <div className="md:col-span-2 flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => navigate('/quan-tri/phim')}
            className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-800"
          >
            Huỷ
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-brand-coral px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Đang lưu…' : 'Tạo phim'}
          </button>
        </div>
      </form>
    </AdminPageShell>
  )
}

function Field({ label, value, onChange, type = 'text', required }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-zinc-300">{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:border-brand-coral focus:outline-none"
      />
    </div>
  )
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-zinc-300">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}
