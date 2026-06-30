import { useAuth } from '../context/useAuth.js'
import { useMyCosmetics } from '../context/useUserCosmetics.js'
import NotificationBell from './NotificationBell.jsx'

export default function Navbar({ onOpenMenu }) {
  const { user, logout } = useAuth()
  const { equipped } = useMyCosmetics()

  const display = user?.name?.trim()
    ? user.name
    : user?.username || user?.email || 'Người dùng'

  const nameEffect = equipped?.name_effect?.cssClass || ''
  const nameBadge = equipped?.name_badge?.badgeHtml || ''

  const roleVi = user?.role === 'ADMIN' ? 'Quản trị' : 'Thành viên'

  return (
    <header className="sticky top-0 z-30 flex items-center gap-4 border-b border-white/10 bg-zinc-950/75 px-4 py-3 backdrop-blur-md sm:px-6">
      <button
        type="button"
        className="flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-200 transition hover:bg-white/10 lg:hidden"
        aria-label="Mở menu"
        onClick={onOpenMenu}
      >
        <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      <div className="min-w-0 flex-1 lg:pl-0" />

      <NotificationBell />

      <div className="hidden flex-col items-end sm:flex">
        <span className={`max-w-[14rem] truncate text-sm font-medium text-zinc-200 ${nameEffect}`}>
          {display} {nameBadge && <span className="ml-1">{nameBadge}</span>}
        </span>
        <span className="text-[11px] text-zinc-500">{roleVi}</span>
      </div>

      <span className="rounded-full bg-brand-coral/15 px-3 py-1 text-[11px] font-semibold text-brand-coral ring-1 ring-brand-coral/30 sm:hidden">
        {roleVi}
      </span>

      <button
        type="button"
        onClick={() => logout()}
        className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:border-red-400/35 hover:bg-red-500/10 hover:text-red-200"
      >
        Đăng xuất
      </button>
    </header>
  )
}
