import { Link, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

/**
 * allowedRoles ví dụ: ['ADMIN']
 */
export default function RoleBasedRoute({ allowedRoles }) {
  const { user } = useAuth()

  if (!allowedRoles.includes(user?.role)) {
    if (!user) {
      return <Navigate to="/login" replace />
    }
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-8">
        <h1 className="text-2xl font-semibold text-white">Không có quyền quản trị</h1>
        <p className="mt-4 text-sm leading-relaxed text-zinc-400">
          Tài khoản của bạn đang là <strong className="text-zinc-300">thành viên</strong>.           Để mở mục quản trị trong menu, tài khoản cần vai trò quản trị viên: cấu hình trên máy chủ (ví dụ biến{' '}
          <code className="rounded bg-zinc-900 px-1 font-mono text-[11px] text-zinc-400">ADMIN_BOOTSTRAP_EMAILS</code>
          ) hoặc cập nhật cột role trong cơ sở dữ liệu.
        </p>
        <Link
          to="/dashboard"
          className="mt-8 inline-flex rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-black"
        >
          Về trang chủ
        </Link>
      </div>
    )
  }

  return <Outlet />
}
