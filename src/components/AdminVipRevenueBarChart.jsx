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

export default function AdminVipRevenueBarChart({ revenueByTier }) {
  const entries = Object.entries(revenueByTier || {}).filter(([, v]) => Number(v) > 0)
  if (!entries.length) return null

  const labels = entries.map(([k]) => k)
  const values = entries.map(([, v]) => Number(v) || 0)

  const data = {
    labels,
    datasets: [
      {
        label: 'Doanh thu (₫)',
        data: values,
        backgroundColor: 'rgba(251, 191, 36, 0.5)',
        borderColor: 'rgba(251, 191, 36, 0.95)',
        borderWidth: 1,
        borderRadius: 8,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            ` ${Number(ctx.raw).toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })}`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.06)' },
        ticks: { color: '#a1a1aa' },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.06)' },
        ticks: { color: '#a1a1aa' },
      },
    },
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-brand-panel/90 p-6 shadow-xl shadow-black/30">
      <h3 className="font-display text-lg font-bold text-white">Doanh thu theo tier</h3>
      <div className="mt-6 h-64 w-full">
        <Bar data={data} options={options} />
      </div>
    </div>
  )
}
