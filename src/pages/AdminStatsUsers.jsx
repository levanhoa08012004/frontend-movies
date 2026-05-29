import { useState } from 'react'
import AdminPageShell from '../components/AdminPageShell.jsx'
import AdminTopMoviesBarChart from '../components/AdminTopMoviesBarChart.jsx'
import * as adminApi from '../services/adminApi'

function toInstantParam(raw) {
  if (!raw) return undefined
  if (raw.includes('Z') || raw.includes('+')) return raw
  return `${raw}:00Z`
}

export default function AdminStatsUsers() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')

  async function fetchStats(ev) {
    ev.preventDefault()
    setErr('')
    try {
      const d = await adminApi.adminAnalyticsUsers(toInstantParam(from), toInstantParam(to))
      setData(d)
    } catch (e) {
      setErr(e.response?.data?.message || e.message)
    }
  }

  const fld = 'vie-input-dark vie-autofill-fix vie-datetime-dark min-h-[54px] max-w-xl font-mono text-sm'

  return (
    <AdminPageShell
      backTo="/quan-tri"
      title="Thống kê người dùng"
      subtitle="Chọn khoảng from / to và chạy — DAU/WAU, top phim theo behavior watch trong kỳ."
    >
      <form onSubmit={fetchStats} className="flex flex-wrap items-end gap-x-10 gap-y-6">
        <div>
          <label className="mb-3 block text-sm font-bold uppercase tracking-wide text-zinc-500">Từ ngày / giờ</label>
          <input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} className={fld} />
        </div>
        <div>
          <label className="mb-3 block text-sm font-bold uppercase tracking-wide text-zinc-500">Đến</label>
          <input type="datetime-local" value={to} onChange={(e) => setTo(e.target.value)} className={fld} />
        </div>
        <button
          type="submit"
          className="min-h-[54px] rounded-xl bg-brand-coral px-10 text-lg font-bold text-white shadow-lg shadow-brand-coral/20 hover:bg-rose-500"
        >
          Chạy thống kê
        </button>
      </form>

      {err ? (
        <p className="mt-10 rounded-2xl border border-red-500/40 bg-red-950/50 px-6 py-4 text-lg text-red-100">{err}</p>
      ) : null}

      {data ? (
        <div className="mt-12 space-y-14">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="DAU (hôm nay)" value={data.dailyActiveUsers} />
            <Metric label="WAU (rolling 7d)" value={data.weeklyActiveUsers} />
            <Metric label="Active trong kỳ" value={data.activeUsersInRange} />
            <Metric label="% user từng trả VIP" value={data.freeToPayingUserPercent} suffix="%" />
          </div>
          <AdminTopMoviesBarChart rows={data.topWatchedMovies} title="Top phim theo watch (behavior) trong kỳ" />
        </div>
      ) : null}
    </AdminPageShell>
  )
}

function Metric({ label, value, suffix = '' }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-brand-panel/80 p-5 shadow-lg shadow-black/25">
      <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-white">
        {value == null ? '—' : typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
        {suffix}
      </p>
    </div>
  )
}
