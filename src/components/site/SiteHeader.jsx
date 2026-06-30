import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'
import { useMyCosmetics } from '../../context/useUserCosmetics.js'
import AvatarFrame from '../cosmetics/AvatarFrame.jsx'
import NotificationBell from './NotificationBell.jsx'

// Nav cho user đã đăng nhập (gồm Watchlist là tính năng gated)
const NAV_USER = [
  { to: '/', label: 'Trang chủ' },
  { to: '/explore', label: 'Phim' },
  { to: '/charts', label: 'Bảng xếp hạng' },
  { to: '/watchlist', label: 'Danh sách xem sau' },
  { to: '/vip', label: 'VIP' },
]

// Nav cho Guest — bỏ Watchlist (cần auth), giữ VIP để khách tham khảo gói trước khi mua
const NAV_GUEST = [
  { to: '/', label: 'Trang chủ' },
  { to: '/explore', label: 'Phim' },
  { to: '/charts', label: 'Bảng xếp hạng' },
  { to: '/vip', label: 'VIP' },
]

export default function SiteHeader() {
  const { user, logout, isGuest } = useAuth()
  const NAV = isGuest ? NAV_GUEST : NAV_USER
  const { equipped } = useMyCosmetics()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [search, setSearch] = useState('')
  const [showProfile, setShowProfile] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const submitSearch = (e) => {
    e.preventDefault()
    const q = search.trim()
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`)
  }

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all ${
        scrolled
          ? 'border-b border-white/5 bg-black/85 shadow-lg shadow-black/40 backdrop-blur-md supports-[backdrop-filter]:bg-black/65'
          : 'bg-gradient-to-b from-black/70 to-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="font-display text-2xl font-black tracking-tight text-brand-coral">
          MOVIE<span className="text-white">+</span>
        </Link>

        <nav className="hidden items-center gap-2 text-sm font-medium md:flex">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                `relative px-2 py-2 transition-colors ${
                  isActive ? 'text-white' : 'text-zinc-400 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span>{n.label}</span>
                  {isActive ? (
                    <span className="absolute inset-x-2 -bottom-[2px] h-[2px] rounded-full bg-brand-coral shadow-[0_0_10px_rgba(244,63,94,0.7)]" />
                  ) : null}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <form onSubmit={submitSearch} className="ml-auto hidden sm:block">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm phim, đạo diễn, diễn viên…"
              className="w-56 rounded-full border border-white/10 bg-zinc-900/80 px-4 py-1.5 pl-9 text-sm text-white placeholder:text-zinc-500 transition focus:border-brand-coral focus:outline-none focus:ring-2 focus:ring-brand-coral/30 lg:w-72"
            />
            <svg className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 110-16 8 8 0 010 16z" />
            </svg>
          </div>
        </form>

        {!isGuest && <NotificationBell />}

        {isGuest ? (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-full border border-white/15 px-4 py-1.5 text-sm font-semibold text-zinc-200 transition hover:border-brand-coral/40 hover:text-white"
            >
              Đăng nhập
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-brand-coral px-4 py-1.5 text-sm font-bold text-white shadow-lg shadow-brand-coral/25 transition hover:bg-rose-500"
            >
              Đăng ký
            </Link>
          </div>
        ) : (
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile((s) => !s)}
            className="flex items-center gap-2 rounded-full px-2 py-1 transition hover:bg-white/5"
            aria-label="Tài khoản"
          >
            <AvatarFrame frame={equipped?.avatar_frame} size={32}>
              <span className="grid h-full w-full place-items-center bg-brand-coral text-sm font-semibold text-white">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </span>
            </AvatarFrame>
            {equipped?.name_badge?.badgeHtml && (
              <span className="text-sm">{equipped.name_badge.badgeHtml}</span>
            )}
            <svg className="h-4 w-4 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showProfile && (
            <div className="absolute right-0 top-12 w-56 overflow-hidden rounded-xl border border-white/10 bg-zinc-900/95 py-2 shadow-2xl shadow-black/60 backdrop-blur">
              <div className="border-b border-white/5 px-4 py-2">
                <p className="truncate text-sm font-semibold text-white">{user?.name || 'User'}</p>
                <p className="truncate text-xs text-zinc-400">{user?.email}</p>
              </div>
              <Link to="/profile" className="block px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/5 hover:text-brand-coral">
                Tài khoản
              </Link>
              <Link to="/watchlist" className="block px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/5 hover:text-brand-coral">
                Danh sách xem sau
              </Link>
              <Link to="/profile/cosmetics" className="block px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/5 hover:text-brand-coral">
                Vật phẩm của tôi
              </Link>
              <Link to="/history" className="block px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/5 hover:text-brand-coral">
                Lịch sử xem
              </Link>
              <Link to="/devices" className="block px-4 py-2 text-sm text-zinc-200 transition hover:bg-white/5 hover:text-brand-coral">
                Thiết bị
              </Link>
              <Link to="/vip" className="block px-4 py-2 text-sm font-semibold text-brand-gold transition hover:bg-white/5">
                ★ Nâng cấp VIP
              </Link>
              {user?.role === 'ADMIN' && (
                <Link to="/quan-tri" className="block px-4 py-2 text-sm font-semibold text-brand-coral transition hover:bg-white/5">
                  Quản trị
                </Link>
              )}
              <div className="my-1 border-t border-white/5" />
              <button
                onClick={async () => {
                  await logout()
                  navigate('/login')
                }}
                className="block w-full px-4 py-2 text-left text-sm text-zinc-200 transition hover:bg-red-500/10 hover:text-red-300"
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
        )}
      </div>
    </header>
  )
}
