import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import AppSidebar from '../components/AppSidebar.jsx'
import Navbar from '../components/Navbar.jsx'

/**
 * Admin-only layout: Sidebar trái + Topbar (Navbar) + Outlet. Khác hẳn user
 * layout (Netflix-style header+footer). Role check ADMIN gắt.
 */
export default function AdminLayout() {
  const { user, initializing } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-300">
        Đang tải phiên đăng nhập…
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-200">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold text-brand-coral">Không có quyền truy cập</h1>
          <p className="text-zinc-400">Khu vực này dành cho quản trị viên.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-50">
      <AppSidebar mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} adminMode />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onOpenMenu={() => setMenuOpen(true)} />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
