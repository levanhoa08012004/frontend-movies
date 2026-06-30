import { Navigate, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

/**
 * Layout dành cho nhân viên CARE: chỉ có topbar mỏng + outlet toàn màn hình.
 * KHÔNG có sidebar admin — CARE không thấy các module quản trị khác.
 *
 * ADMIN cũng được phép vào — họ có thể vừa làm CARE vừa quản trị.
 */
export default function CareLayout() {
  const { user, initializing, logout } = useAuth()
  const navigate = useNavigate()

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-300">
        Đang tải phiên đăng nhập…
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'CARE' && user.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-200">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-brand-coral">Không có quyền</h1>
          <p className="text-zinc-400">Khu vực này dành cho Chăm sóc khách hàng.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-50">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] bg-zinc-900/60 px-5">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-coral text-sm font-bold text-white">CS</span>
          <div className="leading-tight">
            <p className="text-sm font-bold text-white">VieStream — Chăm sóc khách hàng</p>
            <p className="text-[11px] text-zinc-500">{user.email}</p>
          </div>
        </div>
        <button
          onClick={async () => {
            await logout()
            navigate('/login', { replace: true })
          }}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:border-red-500/40 hover:text-red-300"
        >
          Đăng xuất
        </button>
      </header>
      <div className="min-h-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}
