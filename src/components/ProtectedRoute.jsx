import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import AppSidebar from './AppSidebar.jsx'
import Navbar from './Navbar.jsx'

export default function ProtectedRoute() {
  const { user, initializing } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-brand-coral">
        Đang tải phiên đăng nhập…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-50">
      <AppSidebar mobileOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onOpenMenu={() => setMenuOpen(true)} />
        <Outlet />
      </div>
    </div>
  )
}
