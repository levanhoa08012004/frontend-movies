import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import * as authApi from '../services/authApi'

export default function Profile() {
  const navigate = useNavigate()
  const { user, refreshUser, clearLocalSession } = useAuth()
  const [nameDraft, setNameDraft] = useState('')
  const [toast, setToast] = useState('')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwdBusy, setPwdBusy] = useState(false)
  const [pwdErr, setPwdErr] = useState('')

  useEffect(() => {
    document.title = 'Hồ sơ — VieStream'
    setNameDraft(user?.name || '')
    refreshUser().catch(() => {})
  }, [user?.name, refreshUser])

  async function fakeSave(ev) {
    ev.preventDefault()
    setToast('Chức năng lưu hồ sơ sẽ được bật khi backend hỗ trợ cập nhật.')
    window.setTimeout(() => setToast(''), 3800)
  }

  async function onChangePassword(ev) {
    ev.preventDefault()
    setPwdErr('')
    setToast('')
    if (newPw.length < 6) {
      setPwdErr('Mật khẩu mới cần ít nhất 6 ký tự.')
      return
    }
    if (newPw !== confirmPw) {
      setPwdErr('Mật khẩu mới và xác nhận không khớp.')
      return
    }
    setPwdBusy(true)
    try {
      const body = await authApi.changePassword({ currentPassword: currentPw, newPassword: newPw })
      clearLocalSession()
      navigate('/login', {
        replace: true,
        state: { pwdChanged: true, pwdMessage: body?.message || 'Đã đổi mật khẩu. Đăng nhập lại.' },
      })
    } catch (e) {
      const d = e.response?.data
      setPwdErr(d?.message || e.message || 'Không đổi được mật khẩu.')
    } finally {
      setPwdBusy(false)
    }
  }

  const displayName = user?.name?.trim() || user?.email || 'Thành viên'
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <div className="relative mx-auto min-h-screen max-w-[960px] px-5 pb-24 pt-8 sm:px-8 lg:pb-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_85%_60%_at_50%_-10%,rgba(225,29,72,0.12),transparent)]" />

      <div className="relative">
        <h1 className="font-display text-4xl font-bold tracking-tight text-white md:text-5xl">Hồ sơ của tôi</h1>
        <p className="mt-3 max-w-xl text-lg text-zinc-400">Tài khoản VieStream và gói thành viên.</p>
      </div>

      {/* Hero */}
      <div className="relative mt-10 overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-brand-panel via-brand-ink to-zinc-950 p-8 shadow-2xl shadow-black/50 md:flex md:items-center md:gap-10 md:p-12">
        <div className="relative mx-auto shrink-0 md:mx-0">
          <div className="flex size-[120px] items-center justify-center overflow-hidden rounded-3xl border-2 border-white/15 bg-black/60 text-4xl font-bold text-brand-coral ring-4 ring-brand-coral/15 md:size-[144px]">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          {user?.role === 'ADMIN' ? (
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-brand-coral/35 bg-brand-coral/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-black">
              Quản trị
            </span>
          ) : null}
        </div>

        <div className="mt-8 flex-1 text-center md:mt-0 md:text-left">
          <p className="font-display text-3xl font-bold text-white">{displayName}</p>
          <p className="mt-3 text-[15px] text-zinc-500">{user?.email}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
            <span className="rounded-full border border-amber-500/35 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-brand-gold">
              Gói: {user?.vipTier || 'Thường'}
            </span>
            <Link
              to="/vip"
              className="rounded-full border border-brand-coral/35 bg-brand-coral/15 px-4 py-2 text-sm font-bold text-brand-coral transition hover:bg-brand-coral/25"
            >
              Nâng cấp VIP
            </Link>
          </div>
        </div>
      </div>

      {/* Lối tắt */}
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { to: '/watchlist', label: 'Danh sách xem sau' },
          { to: '/history', label: 'Lịch sử xem' },
          { to: '/notifications', label: 'Thông báo' },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className="rounded-2xl border border-white/[0.08] bg-brand-panel px-6 py-5 text-center text-base font-semibold text-zinc-200 transition hover:border-brand-coral/35 hover:bg-brand-coral/[0.07]"
          >
            {item.label}
          </Link>
        ))}
      </div>

      {/* Thông tin */}
      <div className="mt-10 rounded-3xl border border-white/[0.08] bg-black/35 p-8 md:p-10">
        <h2 className="font-display text-xl font-bold text-white">Chi tiết tài khoản</h2>
        <dl className="mt-8 grid gap-8 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-zinc-600">Email đăng nhập</dt>
            <dd className="mt-2 text-[17px] text-zinc-100">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-zinc-600">ID</dt>
            <dd className="mt-2 text-[17px] text-zinc-300">{user?.id ?? '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-zinc-600">Vai trò</dt>
            <dd className="mt-2 text-[17px] text-brand-coral">{user?.role || 'USER'}</dd>
          </div>
        </dl>

        <div className="mt-10 border-t border-white/10 pt-10">
          <h3 className="font-display text-lg font-bold text-white">Đặt lại mật khẩu</h3>
          <p className="mt-2 max-w-xl text-sm text-zinc-500">
            Nhập mật khẩu hiện tại và mật khẩu mới (tối thiểu 6 ký tự). Chỉ áp dụng tài khoản đã có mật khẩu cục bộ — tài khoản chỉ Google dùng đăng nhập Google hoặc trang quên mật khẩu.
          </p>
          <form className="mt-6 max-w-md space-y-4" onSubmit={onChangePassword}>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-600">Mật khẩu hiện tại</label>
              <input
                type="password"
                autoComplete="current-password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="vie-input-dark vie-autofill-fix w-full"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-600">Mật khẩu mới</label>
              <input
                type="password"
                autoComplete="new-password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="vie-input-dark vie-autofill-fix w-full"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-600">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="vie-input-dark vie-autofill-fix w-full"
              />
            </div>
            {pwdErr ? (
              <p className="rounded-lg border border-red-500/40 bg-red-950/60 px-3 py-2 text-sm text-red-200">{pwdErr}</p>
            ) : null}
            <button
              type="submit"
              disabled={pwdBusy}
              className="rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-6 py-3 text-sm font-bold text-emerald-100 hover:bg-emerald-950/50 disabled:opacity-50"
            >
              {pwdBusy ? 'Đang lưu…' : 'Đặt lại mật khẩu'}
            </button>
          </form>
        </div>

        <form className="mt-10 border-t border-white/10 pt-10" onSubmit={fakeSave}>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-600">Tên hiển thị</label>
          <input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            className="vie-input-dark vie-autofill-fix mt-4 max-w-md"
          />
          <button
            type="submit"
            className="mt-6 rounded-xl bg-brand-coral px-10 py-3 text-base font-bold text-white shadow-lg shadow-brand-coral/25 hover:bg-rose-500"
          >
            Lưu thay đổi
          </button>
          <p className="mt-3 text-xs text-zinc-600">Đồng bộ thực đến máy chủ sẽ có sau khi có API chỉnh sửa.</p>
        </form>

        {toast ? (
          <p className="mt-8 rounded-xl border border-amber-500/35 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">{toast}</p>
        ) : null}
      </div>
    </div>
  )
}
