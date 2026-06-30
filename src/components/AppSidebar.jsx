import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'

const item =
  'block rounded-xl px-3 py-2.5 text-sm text-zinc-400 transition hover:bg-white/5 hover:text-white'
const active =
  'block rounded-xl bg-emerald-500/12 px-3 py-2.5 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-500/25'

function NavItem({ to, end, children, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) => (isActive ? active : item)}
    >
      {children}
    </NavLink>
  )
}

export default function AppSidebar({ mobileOpen, onClose, adminMode = false }) {
  const { user } = useAuth()

  function handleNav() {
    onClose?.()
  }

  // adminMode=true → AdminLayout chỉ render block quản lý, không render bất cứ
  // mục user-facing nào (Trang chủ / Khám phá / Watchlist / VIP / Profile).
  const showUserNav = !adminMode

  const panel = (
    <aside className="flex h-full w-60 flex-shrink-0 flex-col border-r border-white/10 bg-zinc-950/98 backdrop-blur-xl lg:bg-zinc-950/90">
      <div className="border-b border-white/10 px-5 py-5">
        <Link
          to={adminMode ? '/quan-tri' : '/dashboard'}
          className="font-display text-xl font-bold tracking-tight text-emerald-400"
          onClick={handleNav}
        >
          VieStream{adminMode ? ' Admin' : ''}
        </Link>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-600">
          {adminMode ? 'Khu vực quản trị viên.' : 'Xem phim mọi lúc, mọi nơi.'}
        </p>
      </div>
      <nav className="flex-1 space-y-8 overflow-y-auto px-3 py-5">
        {showUserNav && (
          <>
            <div>
              <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
                Khám phá
              </p>
              <div className="space-y-0.5">
                <NavItem to="/dashboard" end onNavigate={handleNav}>
                  Trang chủ
                </NavItem>
                <NavItem to="/explore" onNavigate={handleNav}>
                  Lọc &amp; tìm theo thể loại
                </NavItem>
                <NavItem to="/search" onNavigate={handleNav}>
                  Tìm kiếm
                </NavItem>
                <NavItem to="/charts" onNavigate={handleNav}>
                  Bảng xếp hạng
                </NavItem>
              </div>
            </div>
            <div>
              <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
                Tài khoản
              </p>
              <div className="space-y-0.5">
                <NavItem to="/watchlist" onNavigate={handleNav}>
                  Danh sách xem sau
                </NavItem>
                <NavItem to="/history" onNavigate={handleNav}>
                  Lịch sử xem
                </NavItem>
                <NavItem to="/devices" onNavigate={handleNav}>
                  Thiết bị đăng nhập
                </NavItem>
                <NavItem to="/notifications" onNavigate={handleNav}>
                  Thông báo
                </NavItem>
                <NavItem to="/profile" onNavigate={handleNav}>
                  Hồ sơ của tôi
                </NavItem>
              </div>
            </div>
            <div>
              <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
                Gợi ý &amp; gói
              </p>
              <div className="space-y-0.5">
                <NavItem to="/vip" onNavigate={handleNav}>
                  Thành viên VIP
                </NavItem>
                <NavItem to="/" onNavigate={handleNav}>
                  Tìm phim bằng hội thoại
                </NavItem>
              </div>
            </div>
          </>
        )}
        {user?.role === 'ADMIN' ? (
          <div>
            <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-500/90">
              Quản lý hệ thống
            </p>
            <div className="space-y-0.5 rounded-xl border border-amber-500/15 bg-amber-500/[0.04] p-2">
              <NavItem to="/quan-tri" end onNavigate={handleNav}>
                Bảng quản trị
              </NavItem>
              <NavItem to="/quan-tri/nguoi-dung" onNavigate={handleNav}>
                Người dùng
              </NavItem>
              <NavItem to="/quan-tri/phim" onNavigate={handleNav}>
                Kho phim
              </NavItem>
              <NavItem to="/quan-tri/tap" onNavigate={handleNav}>
                Tập phim
              </NavItem>
              <NavItem to="/quan-tri/vip" onNavigate={handleNav}>
                Gói VIP
              </NavItem>
              <NavItem to="/quan-tri/vip/dac-quyen" onNavigate={handleNav}>
                Đặc quyền VIP
              </NavItem>
              <NavItem to="/quan-tri/vip/items" onNavigate={handleNav}>
                Vật phẩm VIP
              </NavItem>
              <NavItem to="/quan-tri/thong-ke" onNavigate={handleNav}>
                Thống kê xem &amp; tương tác
              </NavItem>
              <NavItem to="/quan-tri/bao-cao-vip" onNavigate={handleNav}>
                Báo cáo VIP
              </NavItem>
              <NavItem to="/quan-tri/thong-bao" onNavigate={handleNav}>
                Quản lý thông báo
              </NavItem>
            </div>
          </div>
        ) : null}
      </nav>
    </aside>
  )

  return (
    <>
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-out lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:flex`}
      >
        {panel}
      </div>
      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm lg:hidden"
          aria-label="Đóng menu"
          onClick={onClose}
        />
      ) : null}
    </>
  )
}
