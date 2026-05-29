import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

const chartOpts = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.raw?.toLocaleString?.('vi-VN') ?? ctx.raw} lượt`,
      },
    },
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.06)' },
      ticks: { color: '#a1a1aa', font: { size: 11 } },
    },
    y: {
      grid: { display: false },
      ticks: { color: '#e4e4e7', font: { size: 11 }, maxRotation: 0 },
    },
  },
}

export default function AdminTopMoviesBarChart({ rows, title }) {
  const list = (rows || []).slice(0, 12)
  if (!list.length) return null

  const labels = list.map((r) => {
    const t = r.title || r.movieTitle || ''
    return t.length > 36 ? `${t.slice(0, 34)}…` : t
  })
  const values = list.map((r) => Number(r.watchEventCount ?? r.count ?? 0) || 0)

  const data = {
    labels,
    datasets: [
      {
        label: 'Lượt xem (behavior)',
        data: values,
        backgroundColor: 'rgba(244, 63, 94, 0.55)',
        borderColor: 'rgba(244, 63, 94, 0.9)',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-brand-panel/90 p-6 shadow-xl shadow-black/30">
      <h3 className="font-display text-lg font-bold text-white">{title}</h3>
      <p className="mt-1 text-xs text-zinc-500">Theo sự kiện watch trong kỳ from–to (backend analytics).</p>
      <div className="mt-6 h-[min(420px,60vh)] w-full">
        <Bar data={data} options={chartOpts} />
      </div>
    </div>
  )
}
