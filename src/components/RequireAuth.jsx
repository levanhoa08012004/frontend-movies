import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

/**
 * Wrapper cho các route yêu cầu đăng nhập (Watchlist, History, Profile,
 * Vip, Notifications, Recommendations, Devices, Profile/Cosmetics).
 *
 * - Guest (chưa đăng nhập) sẽ thấy một trang prompt mời đăng nhập thay vì redirect ngay,
 *   để header + footer Site giữ nguyên — UX nhất quán với mô hình Netflix.
 * - Tuỳ chọn `redirect`: nếu true → redirect /login với state.from (cho luồng cần
 *   quay lại sau login, vd watchlist save).
 */
export default function RequireAuth({ redirect = false }) {
  const { user, initializing } = useAuth()
  const location = useLocation()

  if (initializing) return null

  if (!user) {
    if (redirect) {
      return <Navigate to="/login" replace state={{ from: location }} />
    }
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-coral">
          Cần đăng nhập
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">
          Tính năng này dành cho thành viên
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          Đăng nhập để xem danh sách xem sau, lịch sử xem, gợi ý cá nhân hoá,
          nhận thông báo và mua gói VIP. Khách (Guest) chỉ có thể xem trang chủ,
          khám phá phim và đọc mô tả.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/login"
            state={{ from: location }}
            className="rounded-xl bg-brand-coral px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-coral/25 hover:bg-rose-500"
          >
            Đăng nhập
          </Link>
          <Link
            to="/register"
            className="rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-zinc-200 hover:border-brand-coral/40 hover:text-white"
          >
            Tạo tài khoản mới
          </Link>
          <Link
            to="/"
            className="rounded-xl border border-white/10 px-6 py-3 text-sm text-zinc-400 hover:text-zinc-200"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    )
  }

  return <Outlet />
}
