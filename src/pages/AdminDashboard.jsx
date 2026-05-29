import { Link } from 'react-router-dom'
import AdminPageShell from '../components/AdminPageShell.jsx'

const cells = [
  {
    to: '/quan-tri/nguoi-dung',
    title: 'Người dùng',
    desc: 'Email, vai trò, kích hoạt và tier VIP.',
    tone: 'from-emerald-900/35 to-transparent border-emerald-500/25',
    icon: '👥',
  },
  {
    to: '/quan-tri/phim',
    title: 'Kho phim',
    desc: 'Duyệt & lọc toàn bộ catalogue, mở chi tiết.',
    tone: 'from-cyan-900/35 to-transparent border-cyan-500/25',
    icon: '🎬',
  },
  {
    to: '/quan-tri/thong-ke',
    title: 'Thống kê',
    desc: 'Hoạt động và tương tác theo khoảng thời gian.',
    tone: 'from-violet-900/35 to-transparent border-violet-500/30',
    icon: '📊',
  },
  {
    to: '/quan-tri/bao-cao-vip',
    title: 'Báo cáo VIP',
    desc: 'Doanh thu, tier, đăng ký mới (bucket).',
    tone: 'from-amber-900/40 to-transparent border-amber-500/30',
    icon: '★',
  },
  {
    to: '/quan-tri/nhap-phim',
    title: 'Nhập catalog',
    desc: 'JSON catalogue hợp lệ, tiền tố poster.',
    tone: 'from-rose-900/35 to-transparent border-rose-500/25',
    icon: '⬆',
  },
]

export default function AdminDashboard() {
  return (
    <AdminPageShell
      eyebrow="Bảng điều khiển"
      title="Quản trị VieStream"
      subtitle="Chọn module — giao diện rộng hơn, dữ liệu dễ đọc."
    >
      <div className="grid gap-8 sm:grid-cols-2 xl:gap-10">
        {cells.map((c) => (
          <Link
            key={c.to}
            to={c.to}
            className={`group relative min-h-[200px] overflow-hidden rounded-2xl border bg-gradient-to-br p-10 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/50 xl:min-h-[220px] ${c.tone}`}
          >
            <span className="text-4xl opacity-80 transition group-hover:scale-105">{c.icon}</span>
            <h2 className="font-display mt-6 text-2xl font-bold text-white xl:text-3xl">{c.title}</h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-400 xl:text-lg">{c.desc}</p>
            <span className="mt-8 inline-flex text-base font-semibold text-brand-coral transition group-hover:gap-2">
              Vào module →
            </span>
          </Link>
        ))}
      </div>

      <p className="mt-16 rounded-2xl border border-white/[0.06] bg-brand-panel px-10 py-6 text-center text-base text-zinc-500">
        Thanh toán VIP: nhớ cấu hình sandbox / production và URL quay về sau khi khách hoàn tất giao dịch.
      </p>
    </AdminPageShell>
  )
}
