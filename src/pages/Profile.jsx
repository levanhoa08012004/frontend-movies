import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Modal from '../components/Modal.jsx'
import { useAuth } from '../context/useAuth.js'
import { useMyCosmetics } from '../context/useUserCosmetics.js'
import AvatarFrame from '../components/cosmetics/AvatarFrame.jsx'
import * as authApi from '../services/authApi'
import { assetUrl } from '../utils/assetUrl.js'

const MAX_AVATAR_BYTES = 5 * 1024 * 1024

export default function Profile() {
  const navigate = useNavigate()
  const { user, refreshUser, clearLocalSession } = useAuth()
  const { equipped: cosmetics } = useMyCosmetics()
  const bannerClass = cosmetics?.profile_banner?.cssClass || ''
  const bannerImage = cosmetics?.profile_banner?.imageUrl || ''
  const avatarFrameItem = cosmetics?.avatar_frame
  const nameEffect = cosmetics?.name_effect?.cssClass || ''
  const nameBadge = cosmetics?.name_badge?.badgeHtml || ''
  const fileInputRef = useRef(null)
  const [editOpen, setEditOpen] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [pickedFile, setPickedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [dobDraft, setDobDraft] = useState('')
  const [phoneDraft, setPhoneDraft] = useState('')
  const [genderDraft, setGenderDraft] = useState('')
  const [addressDraft, setAddressDraft] = useState('')
  const [toast, setToast] = useState('')
  const [profileBusy, setProfileBusy] = useState(false)
  const [profileErr, setProfileErr] = useState('')
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwdBusy, setPwdBusy] = useState(false)
  const [pwdErr, setPwdErr] = useState('')

  useEffect(() => {
    document.title = 'Hồ sơ — VieStream'
    refreshUser().catch(() => {})
  }, [refreshUser])

  useEffect(() => {
    if (!previewUrl || !previewUrl.startsWith('blob:')) return undefined
    return () => URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  function openEdit() {
    setNameDraft(user?.name || '')
    setPickedFile(null)
    setPreviewUrl(assetUrl(user?.avatar) || '')
    setDobDraft(user?.dob || '')
    setPhoneDraft(user?.phone || '')
    setGenderDraft(user?.gender || '')
    setAddressDraft(user?.address || '')
    setProfileErr('')
    setEditOpen(true)
  }

  function closeEdit() {
    if (profileBusy) return
    setEditOpen(false)
  }

  function onPickFile(ev) {
    const file = ev.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setProfileErr('Vui lòng chọn file ảnh (JPG/PNG/GIF/WebP).')
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setProfileErr('Ảnh quá lớn — tối đa 5MB.')
      return
    }
    setProfileErr('')
    setPickedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function onSaveProfile(ev) {
    ev.preventDefault()
    setProfileErr('')
    setProfileBusy(true)
    try {
      if (pickedFile) {
        await authApi.uploadAvatar(pickedFile)
      }
      const patch = {}
      const newName = nameDraft.trim()
      if (newName !== (user?.name || '')) patch.name = newName
      if (dobDraft !== (user?.dob || '')) patch.dob = dobDraft || null
      if (phoneDraft.trim() !== (user?.phone || '')) patch.phone = phoneDraft.trim()
      if (genderDraft !== (user?.gender || '')) patch.gender = genderDraft || null
      if (addressDraft.trim() !== (user?.address || '')) patch.address = addressDraft.trim()
      if (Object.keys(patch).length > 0) {
        await authApi.updateMyProfile(patch)
      }
      await refreshUser().catch(() => {})
      setEditOpen(false)
      setPickedFile(null)
      setToast('Đã cập nhật hồ sơ.')
      window.setTimeout(() => setToast(''), 3500)
    } catch (e) {
      setProfileErr(e?.response?.data?.message || e?.message || 'Không lưu được.')
    } finally {
      setProfileBusy(false)
    }
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
  const editInitials = (nameDraft?.trim() || displayName).slice(0, 2).toUpperCase()
  const heroAvatarUrl = assetUrl(user?.avatar)

  return (
    <div className="relative mx-auto min-h-screen max-w-[960px] px-5 pb-24 pt-8 sm:px-8 lg:pb-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_85%_60%_at_50%_-10%,rgba(225,29,72,0.12),transparent)]" />

      <div className="relative">
        <h1 className="font-display text-4xl font-bold tracking-tight text-white md:text-5xl">Hồ sơ của tôi</h1>
        <p className="mt-3 max-w-xl text-lg text-zinc-400">Tài khoản VieStream và gói thành viên.</p>
      </div>

      {/* Hero */}
      <div
        className={`relative mt-10 overflow-hidden rounded-3xl border border-white/[0.08] p-8 shadow-2xl shadow-black/50 md:p-12 ${bannerClass || 'bg-gradient-to-br from-brand-panel via-brand-ink to-zinc-950'}`}
        style={bannerImage ? { backgroundImage: `url("${assetUrl(bannerImage) || bannerImage}")`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        {(bannerClass || bannerImage) && (
          <div aria-hidden className="absolute inset-0 bg-black/40" />
        )}
        <div className="relative md:flex md:items-center md:gap-10">
        <div className="relative mx-auto shrink-0 md:mx-0">
          <AvatarFrame frame={avatarFrameItem} size={144}>
            <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-black/60 text-4xl font-bold text-brand-coral">
              {heroAvatarUrl ? (
                <img src={heroAvatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </span>
          </AvatarFrame>
          {user?.role === 'ADMIN' ? (
            <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-brand-coral/35 bg-brand-coral/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-black">
              Quản trị
            </span>
          ) : null}
        </div>

        <div className="mt-8 flex-1 text-center md:mt-0 md:text-left">
          <p className="font-display text-3xl font-bold text-white">
            <span className={nameEffect}>{displayName}</span>
            {nameBadge && <span className="ml-2 text-2xl">{nameBadge}</span>}
          </p>
          <p className="mt-3 text-[15px] text-zinc-300">{user?.email}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 md:justify-start">
            <span className="rounded-full border border-amber-500/35 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-brand-gold">
              Gói: {user?.vipTier || 'Thường'}
            </span>
            <button
              type="button"
              onClick={openEdit}
              className="rounded-full bg-brand-coral px-5 py-2 text-sm font-bold text-white shadow-lg shadow-brand-coral/25 transition hover:bg-rose-500"
            >
              Chỉnh sửa hồ sơ
            </button>
            <Link
              to="/vip"
              className="rounded-full border border-brand-coral/35 bg-brand-coral/15 px-4 py-2 text-sm font-bold text-brand-coral transition hover:bg-brand-coral/25"
            >
              Nâng cấp VIP
            </Link>
          </div>
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
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-xl font-bold text-white">Thông tin cá nhân</h2>
          <button
            type="button"
            onClick={openEdit}
            className="rounded-full border border-white/15 px-4 py-1.5 text-xs font-semibold text-zinc-300 hover:border-brand-coral/40 hover:text-white"
          >
            ✎ Chỉnh sửa
          </button>
        </div>
        <dl className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-zinc-600">Email đăng nhập</dt>
            <dd className="mt-2 text-[17px] text-zinc-100">{user?.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-zinc-600">Số điện thoại</dt>
            <dd className="mt-2 text-[17px] text-zinc-100">{user?.phone || <span className="text-zinc-600">Chưa cập nhật</span>}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-zinc-600">Ngày sinh</dt>
            <dd className="mt-2 text-[17px] text-zinc-100">
              {user?.dob ? new Date(user.dob).toLocaleDateString('vi-VN') : <span className="text-zinc-600">Chưa cập nhật</span>}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-zinc-600">Giới tính</dt>
            <dd className="mt-2 text-[17px] text-zinc-100">
              {{ MALE: 'Nam', FEMALE: 'Nữ', OTHER: 'Khác', UNSPECIFIED: 'Không tiết lộ' }[user?.gender] || <span className="text-zinc-600">Chưa cập nhật</span>}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-bold uppercase tracking-wider text-zinc-600">Địa chỉ</dt>
            <dd className="mt-2 text-[17px] text-zinc-100">{user?.address || <span className="text-zinc-600">Chưa cập nhật</span>}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wider text-zinc-600">ID tài khoản</dt>
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
              className="rounded-xl bg-brand-coral px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-coral/25 hover:bg-brand-accent disabled:opacity-50"
            >
              {pwdBusy ? 'Đang lưu…' : 'Đặt lại mật khẩu'}
            </button>
          </form>
        </div>

        {toast ? (
          <p className="mt-8 rounded-xl border border-amber-500/35 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">{toast}</p>
        ) : null}
      </div>

      <Modal isOpen={editOpen} onClose={closeEdit} title="Chỉnh sửa hồ sơ" widthClass="max-w-xl">
        <form onSubmit={onSaveProfile} className="space-y-6">
          <p className="text-sm text-zinc-400">
            Đổi tên hiển thị và ảnh đại diện. Chọn ảnh từ máy tính (JPG/PNG/GIF/WebP, tối đa 5MB).
          </p>

          <div className="grid gap-6 md:grid-cols-[140px_1fr]">
            <div>
              <div className="aspect-square w-32 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                ) : (
                  <div className="grid h-full place-items-center text-3xl font-bold text-brand-coral">{editInitials}</div>
                )}
              </div>
              <p className="mt-2 text-xs text-zinc-600">Xem trước</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-600">Tên hiển thị</label>
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  placeholder="Tên bạn muốn hiển thị"
                  className="vie-input-dark vie-autofill-fix w-full"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-600">Số điện thoại</label>
                <input
                  type="tel"
                  value={phoneDraft}
                  onChange={(e) => setPhoneDraft(e.target.value)}
                  placeholder="0901234567"
                  pattern="^$|^(\+84|0)(3|5|7|8|9)[0-9]{8}$"
                  title="SĐT Việt Nam, vd 0901234567 hoặc +84901234567"
                  className="vie-input-dark vie-autofill-fix w-full"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-600">Ngày sinh</label>
                  <input
                    type="date"
                    value={dobDraft || ''}
                    onChange={(e) => setDobDraft(e.target.value)}
                    max={new Date().toISOString().slice(0, 10)}
                    className="vie-input-dark vie-autofill-fix w-full"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-600">Giới tính</label>
                  <select
                    value={genderDraft || ''}
                    onChange={(e) => setGenderDraft(e.target.value)}
                    className="vie-input-dark vie-autofill-fix w-full"
                  >
                    <option value="">— Chọn —</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                    <option value="UNSPECIFIED">Không tiết lộ</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-600">Địa chỉ</label>
                <input
                  type="text"
                  value={addressDraft}
                  onChange={(e) => setAddressDraft(e.target.value)}
                  placeholder="Số nhà, đường, quận/huyện, tỉnh/TP"
                  maxLength={255}
                  className="vie-input-dark vie-autofill-fix w-full"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-600">Ảnh đại diện</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={onPickFile}
                  className="hidden"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/10"
                  >
                    {previewUrl ? 'Đổi ảnh khác' : 'Chọn ảnh từ máy'}
                  </button>
                  {pickedFile ? (
                    <span className="truncate text-xs text-zinc-500" title={pickedFile.name}>
                      {pickedFile.name} ({Math.round(pickedFile.size / 1024)} KB)
                    </span>
                  ) : null}
                </div>
                {pickedFile || (user?.avatar && previewUrl) ? (
                  <button
                    type="button"
                    onClick={() => { setPickedFile(null); setPreviewUrl(''); if (fileInputRef.current) fileInputRef.current.value = '' }}
                    className="mt-2 text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    Xoá ảnh đã chọn
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {profileErr ? (
            <p className="rounded-lg border border-red-500/40 bg-red-950/60 px-3 py-2 text-sm text-red-200">{profileErr}</p>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/[0.06] pt-5">
            <button
              type="button"
              onClick={closeEdit}
              disabled={profileBusy}
              className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-white/5 disabled:opacity-50"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={profileBusy}
              className="rounded-xl bg-brand-coral px-7 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-coral/25 transition hover:bg-rose-500 disabled:opacity-50"
            >
              {profileBusy ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
