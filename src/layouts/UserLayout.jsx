import { Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import SiteHeader from '../components/site/SiteHeader.jsx'
import SiteFooter from '../components/site/SiteFooter.jsx'
import SupportChatWidget from '../components/site/SupportChatWidget.jsx'

/**
 * Netflix-style layout cho user-facing pages. Cho phép Guest (chưa đăng nhập)
 * truy cập trang chủ / explore / movie detail / search / charts. Các trang cần
 * auth (Watchlist, History, Profile, Vip, …) được wrap bằng RequireAuth riêng
 * trong AppRoutes.
 */
export default function UserLayout() {
  const { initializing } = useAuth()

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-zinc-300">
        Đang tải phiên đăng nhập…
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-black text-zinc-50">
      <SiteHeader />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <SiteFooter />
      <SupportChatWidget />
    </div>
  )
}
