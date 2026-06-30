import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AdminPageShell from '../components/AdminPageShell.jsx'
import AdminTopMoviesBarChart from '../components/AdminTopMoviesBarChart.jsx'
import AdminVipRevenueBarChart from '../components/AdminVipRevenueBarChart.jsx'
import * as adminApi from '../services/adminApi'

const QUICK_LINKS = [
  { to: '/quan-tri/nguoi-dung', title: 'Người dùng', desc: 'Email, vai trò, kích hoạt, VIP', icon: '👥', tone: 'border-emerald-500/25' },
  { to: '/quan-tri/phim', title: 'Kho phim', desc: 'Quản lý catalogue, ẩn/hiện phim', icon: '🎬', tone: 'border-cyan-500/25' },
  { to: '/quan-tri/vip', title: 'Gói VIP', desc: 'Tier, giá, chu kỳ', icon: '★', tone: 'border-amber-500/30' },
  { to: '/quan-tri/vip/dac-quyen', title: 'Đặc quyền VIP', desc: 'Benefits matrix per tier', icon: '🔑', tone: 'border-yellow-500/25' },
  { to: '/quan-tri/vip/items', title: 'Vật phẩm VIP', desc: 'Cosmetic frames/badges/banners', icon: '🎁', tone: 'border-fuchsia-500/25' },
  { to: '/quan-tri/thong-ke', title: 'Thống kê chi tiết', desc: 'DAU/WAU + top phim theo kỳ', icon: '📊', tone: 'border-violet-500/30' },
  { to: '/quan-tri/bao-cao-vip', title: 'Báo cáo VIP', desc: 'Doanh thu bucket, tier breakdown', icon: '💰', tone: 'border-rose-500/25' },
  { to: '/quan-tri/recsys-profile', title: 'Đẩy dữ liệu LLM', desc: 'Rebuild llm_profile 1 user', icon: '🤖', tone: 'border-indigo-500/25' },
]

function isoMinusDays(days) {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

export default function AdminDashboard() {
  const [usersData, setUsersData] = useState(null)
  const [vipData, setVipData] = useState(null)
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      setLoading(true)
      setErr('')
      try {
        const from = isoMinusDays(30)
        const to = new Date().toISOString()
        const [u, v] = await Promise.all([
          adminApi.adminAnalyticsUsers(from, to).catch((e) => {
            console.warn('users analytics failed', e)
            return null
          }),
          adminApi.adminAnalyticsVip(from, to, 'MONTH').catch((e) => {
            console.warn('vip analytics failed', e)
            return null
          }),
        ])
        if (alive) {
          setUsersData(u)
          setVipData(v)
        }
      } catch (e) {
        if (alive) setErr(e?.message || 'Lỗi tải thống kê')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  return (
    <AdminPageShell
      eyebrow="Bảng điều khiển"
      title="Tổng quan VieStream"
      subtitle="Số liệu 30 ngày gần nhất — bấm thẻ để xem báo cáo chi tiết / chuyển module."
    >
      {err ? (
        <p className="mb-6 rounded-2xl border border-red-500/40 bg-red-950/50 px-5 py-4 text-sm text-red-100">{err}</p>
      ) : null}

      {/* KPI cards */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="DAU (hôm nay)"
          value={usersData?.dailyActiveUsers}
          hint="Số user có hành vi trong 24h qua"
          tone="from-emerald-500/15 to-transparent border-emerald-500/30"
          loading={loading}
        />
        <Kpi
          label="WAU (rolling 7d)"
          value={usersData?.weeklyActiveUsers}
          hint="Active trong 7 ngày gần nhất"
          tone="from-cyan-500/15 to-transparent border-cyan-500/30"
          loading={loading}
        />
        <Kpi
          label="VIP còn hạn"
          value={vipData?.totalActiveVipUsers}
          hint="Số tài khoản chưa hết hạn gói"
          tone="from-amber-500/15 to-transparent border-amber-500/30"
          loading={loading}
        />
        <Kpi
          label="Doanh thu 30 ngày"
          value={vipData?.totalRevenueVnd}
          hint="Tổng đơn thành công"
          tone="from-rose-500/15 to-transparent border-rose-500/30"
          loading={loading}
          format="vnd"
        />
      </section>

      {/* Second row: free-to-paying & ARPU */}
      <section className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Active trong kỳ"
          value={usersData?.activeUsersInRange}
          hint="User có hành vi trong 30 ngày"
          tone="from-emerald-500/10 to-transparent border-emerald-500/20"
          loading={loading}
        />
        <Kpi
          label="% từng trả VIP"
          value={usersData?.freeToPayingUserPercent}
          hint="Tỉ lệ user đã từng có gói"
          suffix="%"
          tone="from-violet-500/10 to-transparent border-violet-500/25"
          loading={loading}
        />
        <Kpi
          label="ARPU ước lượng"
          value={vipData?.arpuVnd != null ? Math.round(vipData.arpuVnd) : null}
          hint="Doanh thu / VIP còn hạn"
          tone="from-yellow-500/10 to-transparent border-yellow-500/25"
          loading={loading}
          format="vnd"
        />
        <Kpi
          label="Số gói bán mới"
          value={
            vipData?.newSubscriptionsByBucket
              ? Object.values(vipData.newSubscriptionsByBucket).reduce(
                  (a, b) => Number(a) + Number(b || 0),
                  0
                )
              : null
          }
          hint="Đăng ký mới trong kỳ"
          tone="from-fuchsia-500/10 to-transparent border-fuchsia-500/25"
          loading={loading}
        />
      </section>

      {/* Charts */}
      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        {vipData?.revenueVndByTier ? (
          <AdminVipRevenueBarChart revenueByTier={vipData.revenueVndByTier} />
        ) : (
          <ChartPlaceholder loading={loading} label="Doanh thu theo tier" />
        )}
        {usersData?.topWatchedMovies?.length ? (
          <AdminTopMoviesBarChart rows={usersData.topWatchedMovies} title="Top phim được xem (30 ngày)" />
        ) : (
          <ChartPlaceholder loading={loading} label="Top phim xem" />
        )}
      </section>

      {/* Quick links */}
      <section className="mt-12">
        <h2 className="font-display mb-5 text-sm font-bold uppercase tracking-[0.18em] text-zinc-500">
          Module quản lý
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_LINKS.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-zinc-900/40 to-transparent p-5 transition hover:-translate-y-0.5 hover:bg-zinc-900/70 hover:shadow-xl hover:shadow-black/40 ${c.tone}`}
            >
              <div className="text-2xl">{c.icon}</div>
              <h3 className="font-display mt-3 text-base font-bold text-white">{c.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">{c.desc}</p>
              <span className="mt-3 inline-flex text-xs font-semibold text-brand-coral opacity-0 transition group-hover:opacity-100">
                Mở →
              </span>
            </Link>
          ))}
        </div>
      </section>
    </AdminPageShell>
  )
}

function Kpi({ label, value, hint, suffix = '', tone = '', loading, format }) {
  const display =
    value == null
      ? loading
        ? '…'
        : '—'
      : format === 'vnd'
      ? `${Number(value).toLocaleString('vi-VN')} ₫`
      : typeof value === 'number'
      ? value.toLocaleString('vi-VN')
      : String(value)
  return (
    <div
      className={`rounded-2xl border bg-gradient-to-br p-5 shadow-lg shadow-black/30 ${tone || 'border-white/10 from-zinc-900/40 to-transparent'}`}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-500">{label}</p>
      <p className="font-display mt-2 text-2xl font-bold text-white">
        {display}
        {value != null && suffix ? <span className="ml-1 text-base text-zinc-400">{suffix}</span> : null}
      </p>
      <p className="mt-2 text-xs text-zinc-500">{hint}</p>
    </div>
  )
}

function ChartPlaceholder({ loading, label }) {
  return (
    <div className="grid min-h-[280px] place-items-center rounded-2xl border border-white/[0.06] bg-zinc-900/30 p-6">
      <p className="text-sm text-zinc-500">
        {loading ? `Đang tải ${label}…` : `Chưa có dữ liệu ${label}`}
      </p>
    </div>
  )
}
