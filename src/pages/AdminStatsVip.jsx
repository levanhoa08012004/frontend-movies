import { useState } from 'react'
import AdminPageShell from '../components/AdminPageShell.jsx'
import AdminTopMoviesBarChart from '../components/AdminTopMoviesBarChart.jsx'
import AdminVipRevenueBarChart from '../components/AdminVipRevenueBarChart.jsx'
import { STATS_BUCKET } from '../constants/backend.js'
import * as adminApi from '../services/adminApi'

function toInstantParam(raw) {
  if (!raw) return undefined
  if (raw.includes('Z') || raw.includes('+')) return raw
  return `${raw}:00Z`
}

export default function AdminStatsVip() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [bucket, setBucket] = useState('MONTH')
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')

  async function fetchStats(ev) {
    ev.preventDefault()
    setErr('')
    try {
      const d = await adminApi.adminAnalyticsVip(toInstantParam(from), toInstantParam(to), bucket || 'MONTH')
      setData(d)
    } catch (e) {
      setErr(e.response?.data?.message || e.message)
    }
  }

  const fld = 'vie-input-dark vie-autofill-fix vie-datetime-dark min-h-[54px] font-mono text-sm'

  return (
    <AdminPageShell
      backTo="/quan-tri"
      title="Báo cáo VIP"
      subtitle="Doanh thu theo tier, đăng ký mới theo bucket — kèm biểu đồ."
    >
      <form onSubmit={fetchStats} className="flex flex-wrap items-end gap-x-8 gap-y-6">
        <div>
          <label className="mb-3 block text-sm font-bold uppercase tracking-wide text-zinc-500">Từ</label>
          <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} className={fld} />
        </div>
        <div>
          <label className="mb-3 block text-sm font-bold uppercase tracking-wide text-zinc-500">Đến</label>
          <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} className={fld} />
        </div>
        <div>
          <label className="mb-3 block text-sm font-bold uppercase tracking-wide text-zinc-500">Bucket</label>
          <select value={bucket} onChange={(e) => setBucket(e.target.value)} className={`${fld} min-w-[180px] cursor-pointer`}>
            {STATS_BUCKET.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="min-h-[54px] rounded-xl bg-brand-coral px-10 text-lg font-bold text-white shadow-lg shadow-brand-coral/20 hover:bg-rose-500"
        >
          Chạy báo cáo
        </button>
      </form>

      {err ? (
        <p className="mt-10 rounded-2xl border border-red-500/40 bg-red-950/50 px-6 py-4 text-lg text-red-100">{err}</p>
      ) : null}

      {data ? (
        <div className="mt-12 space-y-12">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.08] bg-brand-panel/80 p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">VIP đang còn hạn</p>
              <p className="mt-2 font-display text-3xl font-bold text-white">{data.totalActiveVipUsers?.toLocaleString?.('vi-VN')}</p>
              <p className="mt-4 text-sm text-zinc-500">Tổng doanh thu kỳ: {data.totalRevenueVnd?.toLocaleString?.('vi-VN')} ₫</p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-brand-panel/80 p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">ARPU (ước lượng)</p>
              <p className="mt-2 font-display text-3xl font-bold text-brand-gold">
                {data.arpuVnd != null ? `${Math.round(data.arpuVnd).toLocaleString('vi-VN')} ₫` : '—'}
              </p>
            </div>
          </div>
          <AdminVipRevenueBarChart revenueByTier={data.revenueVndByTier} />
          <AdminTopMoviesBarChart rows={data.topWatchedAmongPayingUsers} title="Top xem trong kỳ (user đã trả VIP)" />
        </div>
      ) : null}
    </AdminPageShell>
  )
}
