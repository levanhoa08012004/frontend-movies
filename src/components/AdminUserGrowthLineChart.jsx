import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Filler, Tooltip, Legend)

/**
 * Line chart tăng trưởng người dùng theo thời gian.
 *
 * 2 series:
 * - "User mới / ngày" (cột phụ, bar-like nhưng vẫn dùng Line gradient để gọn lib).
 * - "Tổng cộng dồn" — cumulative line màu coral, fill mờ.
 *
 * Tự ẩn nếu series rỗng.
 */
export default function AdminUserGrowthLineChart({ series, title = 'Tăng trưởng người dùng theo ngày' }) {
  const list = Array.isArray(series) ? series : []
  if (!list.length) return null

  const labels = list.map((p) => p.date)
  const newUsers = list.map((p) => Number(p.newUsers) || 0)
  const cumulative = list.map((p) => Number(p.cumulativeUsers) || 0)

  const data = {
    labels,
    datasets: [
      {
        label: 'Tổng tích luỹ',
        data: cumulative,
        borderColor: 'rgba(244, 63, 94, 1)',
        backgroundColor: 'rgba(244, 63, 94, 0.18)',
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 5,
        fill: true,
        tension: 0.3,
        yAxisID: 'y',
      },
      {
        label: 'User mới / ngày',
        data: newUsers,
        borderColor: 'rgba(56, 189, 248, 0.9)',
        backgroundColor: 'rgba(56, 189, 248, 0.12)',
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 5,
        borderDash: [4, 4],
        fill: false,
        tension: 0.25,
        yAxisID: 'y1',
      },
    ],
  }

  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#e4e4e7', font: { size: 12 } },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed.y?.toLocaleString?.('vi-VN') ?? ctx.parsed.y
            return ` ${ctx.dataset.label}: ${v} user`
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: {
          color: '#a1a1aa',
          font: { size: 11 },
          maxRotation: 45,
          autoSkip: true,
          maxTicksLimit: 14,
        },
      },
      y: {
        type: 'linear',
        position: 'left',
        beginAtZero: true,
        grid: { color: 'rgba(255,255,255,0.06)' },
        ticks: {
          color: '#fda4af',
          font: { size: 11 },
          callback: (v) => Number(v).toLocaleString('vi-VN'),
        },
        title: { display: true, text: 'Tổng tích luỹ', color: '#fda4af', font: { size: 11 } },
      },
      y1: {
        type: 'linear',
        position: 'right',
        beginAtZero: true,
        grid: { drawOnChartArea: false },
        ticks: {
          color: '#7dd3fc',
          font: { size: 11 },
          stepSize: 1,
          precision: 0,
        },
        title: { display: true, text: 'User mới / ngày', color: '#7dd3fc', font: { size: 11 } },
      },
    },
  }

  // Stats nhanh để hiển thị tóm tắt trên header chart
  const totalNew = newUsers.reduce((s, x) => s + x, 0)
  const peakDay = list.reduce((best, p) => (p.newUsers > (best?.newUsers ?? -1) ? p : best), null)
  const latest = cumulative[cumulative.length - 1] ?? 0

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-brand-panel/90 p-6 shadow-xl shadow-black/30">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold text-white">{title}</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Đăng ký theo ngày (UTC) — line coral là tổng tích luỹ, line xanh dứt nét là số đăng ký mới mỗi ngày.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-200">
            Hiện có: <strong>{latest.toLocaleString('vi-VN')}</strong> user
          </span>
          <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-200">
            Mới trong kỳ: <strong>{totalNew.toLocaleString('vi-VN')}</strong>
          </span>
          {peakDay && peakDay.newUsers > 0 ? (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-200">
              Cao nhất: <strong>{peakDay.newUsers}</strong> · {peakDay.date}
            </span>
          ) : null}
        </div>
      </div>
      <div className="mt-6 h-[min(420px,60vh)] w-full">
        <Line data={data} options={opts} />
      </div>
    </div>
  )
}
