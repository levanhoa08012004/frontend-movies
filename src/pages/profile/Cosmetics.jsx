import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listMyCosmetics, myEquipped, equipItem } from '../../services/cosmeticApi.js'
import { invalidateMyCosmetics } from '../../context/useUserCosmetics.js'
import { useAuth } from '../../context/useAuth.js'
import AvatarFrame from '../../components/cosmetics/AvatarFrame.jsx'

const TYPE_LABELS = {
  avatar_frame:   { label: 'Khung Avatar',    icon: '🖼️', tagline: 'Viền sang trọng xung quanh ảnh đại diện' },
  comment_frame:  { label: 'Khung Bình Luận', icon: '💬', tagline: 'Viền + bóng đổ cho bình luận của bạn' },
  name_badge:     { label: 'Badge Tên',       icon: '👑', tagline: 'Biểu tượng cạnh tên hiển thị' },
  profile_banner: { label: 'Banner Profile',  icon: '🌅', tagline: 'Hình nền trên trang cá nhân' },
  chat_color:     { label: 'Màu Chữ',         icon: '🎨', tagline: 'Màu chữ riêng cho bình luận' },
  name_effect:    { label: 'Hiệu Ứng Tên',    icon: '✨', tagline: 'Animation lên tên hiển thị' },
}

const RARITY_CFG = {
  COMMON:    { cls: 'bg-zinc-500/25 text-zinc-200',                                 ring: 'ring-zinc-400/30',  label: 'Thường' },
  RARE:      { cls: 'bg-blue-500/25 text-blue-200',                                 ring: 'ring-blue-400/40',  label: 'Hiếm' },
  EPIC:      { cls: 'bg-purple-500/30 text-purple-200',                             ring: 'ring-purple-400/50',label: 'Sử thi' },
  LEGENDARY: { cls: 'bg-gradient-to-r from-amber-500 to-rose-500 text-white',       ring: 'ring-amber-400/60', label: 'Huyền thoại' },
}

export default function Cosmetics() {
  const { user } = useAuth()
  const [tabs, setTabs] = useState([])
  const [activeTab, setActiveTab] = useState('avatar_frame')
  const [equipped, setEquipped] = useState({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function reload() {
    setLoading(true)
    try {
      const [items, eq] = await Promise.all([listMyCosmetics(), myEquipped()])
      setTabs(items)
      setEquipped(eq || {})
      const keys = Object.keys(items)
      if (keys.length && !keys.includes(activeTab)) setActiveTab(keys[0])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Vật phẩm VIP — Movie+'
    reload().catch(() => {})
  }, [])

  async function pick(itemId) {
    setBusy(true)
    setMsg('')
    try {
      await equipItem(itemId)
      invalidateMyCosmetics()
      await reload()
      setMsg('✓ Đã trang bị thành công.')
      window.setTimeout(() => setMsg(''), 2200)
    } catch (ex) {
      setMsg(ex?.response?.data?.message || ex.message)
    } finally {
      setBusy(false)
    }
  }

  const activeTypes = useMemo(() => Object.keys(tabs), [tabs])
  const activeItems = tabs[activeTab] || []
  const equippedIdForTab = equipped[activeTab]?.id
  const userInitial = (user?.name?.[0] || 'A').toUpperCase()
  const userName = user?.name || user?.email?.split('@')[0] || 'Bạn'

  // Counts: items đã unlock vs tổng
  const stats = useMemo(() => {
    let unlocked = 0, total = 0
    Object.values(tabs).forEach((arr) => {
      arr.forEach((i) => { total++; if (i.unlocked) unlocked++ })
    })
    return { unlocked, total }
  }, [tabs])

  const equippedCount = Object.keys(equipped).length

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-neutral-950 to-zinc-950 pb-20">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(244,63,94,0.15),transparent)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <Link to="/profile" className="text-sm font-medium text-zinc-500 transition hover:text-brand-coral">
          ← Tài khoản
        </Link>

        {/* Hero stats */}
        <header className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-coral">VIP Cosmetics</p>
            <h1 className="font-display mt-2 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">Vật phẩm của bạn</h1>
            <p className="mt-3 max-w-2xl text-sm text-zinc-400">
              Khung viền, badge và hiệu ứng độc quyền dành cho thành viên VIP. Hiển thị ở mọi nơi
              bạn xuất hiện — comment, avatar, profile.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <StatBox label="Đã mở khoá" value={`${stats.unlocked}/${stats.total}`} />
            <StatBox label="Đang dùng" value={`${equippedCount} loại`} />
          </div>
        </header>

        {loading ? (
          <p className="mt-10 text-center text-zinc-500">Đang tải…</p>
        ) : (
          <>
            {/* Tab pills */}
            <div className="mt-8 flex flex-wrap gap-2">
              {activeTypes.map((t) => {
                const meta = TYPE_LABELS[t] || { label: t, icon: '·' }
                const total = (tabs[t] || []).length
                const unlocked = (tabs[t] || []).filter((i) => i.unlocked).length
                return (
                  <button key={t} onClick={() => setActiveTab(t)}
                    className={`group flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                      activeTab === t
                        ? 'bg-brand-coral text-white shadow-lg shadow-brand-coral/30'
                        : 'border border-white/10 bg-white/[0.04] text-zinc-300 hover:border-brand-coral/40 hover:bg-brand-coral/5'
                    }`}>
                    <span className="text-base">{meta.icon}</span>
                    <span>{meta.label}</span>
                    <span className={`rounded-full px-1.5 text-[10px] tabular-nums ${
                      activeTab === t ? 'bg-white/20' : 'bg-white/5 text-zinc-500'
                    }`}>
                      {unlocked}/{total}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Type description */}
            {TYPE_LABELS[activeTab] && (
              <p className="mt-5 flex items-center gap-2 text-sm text-zinc-400">
                <span className="text-base">{TYPE_LABELS[activeTab].icon}</span>
                {TYPE_LABELS[activeTab].tagline}
              </p>
            )}

            {msg && (
              <p className="mt-4 rounded-xl border border-brand-coral/40 bg-brand-coral/10 px-4 py-3 text-sm font-semibold text-brand-coral">
                {msg}
              </p>
            )}

            {/* Grid items */}
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {activeItems.map((it) => {
                const isEquipped = equippedIdForTab === it.id
                const rarity = RARITY_CFG[it.rarity] || RARITY_CFG.COMMON
                return (
                  <div key={it.id}
                    className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-b from-white/[0.03] to-transparent p-5 transition ${
                      !it.unlocked
                        ? 'border-white/5 opacity-70'
                        : isEquipped
                          ? `border-brand-coral ring-2 ring-brand-coral/50 shadow-xl shadow-brand-coral/15`
                          : `border-white/10 hover:border-brand-coral/40 hover:shadow-xl hover:${rarity.ring}`
                    }`}>

                    {/* Rarity ribbon */}
                    <span className={`absolute right-3 top-3 z-10 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${rarity.cls}`}>
                      {rarity.label}
                    </span>

                    {/* Big preview */}
                    <BigPreview item={it} userInitial={userInitial} userName={userName} />

                    {/* Meta */}
                    <div className="mt-4">
                      <p className="font-display text-lg font-bold text-white">{it.name}</p>
                      {it.description && (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-400">{it.description}</p>
                      )}
                    </div>

                    {/* Lock overlay or action */}
                    {!it.unlocked ? (
                      <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center">
                        <p className="text-xs font-semibold text-amber-200">🔒 Cần gói {it.minTierCode}</p>
                        <Link to="/vip" className="mt-2 inline-block rounded-full bg-brand-coral px-4 py-1 text-xs font-bold text-white hover:bg-brand-accent">
                          Nâng cấp ngay
                        </Link>
                      </div>
                    ) : isEquipped ? (
                      <button disabled
                        className="mt-4 w-full rounded-xl bg-brand-coral/15 px-4 py-2 text-sm font-bold text-brand-coral ring-1 ring-brand-coral/40">
                        ✓ Đang dùng
                      </button>
                    ) : (
                      <button onClick={() => pick(it.id)} disabled={busy}
                        className="mt-4 w-full rounded-xl bg-brand-coral px-4 py-2 text-sm font-bold text-white shadow-lg shadow-brand-coral/30 transition hover:bg-brand-accent disabled:opacity-50">
                        Trang bị
                      </button>
                    )}
                  </div>
                )
              })}
              {!activeItems.length && (
                <p className="col-span-full py-10 text-center text-zinc-500">Chưa có vật phẩm.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatBox({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-center backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="font-display mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  )
}

function BigPreview({ item, userInitial, userName }) {
  const cls = item.cssClass || ''
  if (item.type === 'avatar_frame') {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-xl bg-gradient-to-br from-zinc-900 via-neutral-950 to-black">
        <AvatarFrame frame={item} size={96}>
          <span className="grid h-full w-full place-items-center bg-gradient-to-br from-brand-coral via-rose-500 to-amber-400 text-3xl font-black text-white">
            {userInitial}
          </span>
        </AvatarFrame>
      </div>
    )
  }
  if (item.type === 'comment_frame') {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-xl bg-gradient-to-br from-zinc-900 via-neutral-950 to-black p-4">
        <div className={`flex w-full max-w-xs gap-2 rounded-lg p-3 ${cls || 'border border-white/10'}`}>
          <div className="size-7 shrink-0 rounded-full bg-brand-coral text-xs grid place-items-center font-bold text-white">
            {userInitial}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white">{userName}</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-300">Phim hay quá! Ai cũng nên xem.</p>
          </div>
        </div>
      </div>
    )
  }
  if (item.type === 'name_badge') {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-xl bg-gradient-to-br from-zinc-900 via-neutral-950 to-black">
        <span className="flex items-center gap-2 text-xl font-bold text-white">
          {userName}
          <span className="text-2xl">{item.badgeHtml}</span>
        </span>
      </div>
    )
  }
  if (item.type === 'profile_banner') {
    const style = item.imageUrl
      ? { backgroundImage: `url("${item.imageUrl}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : undefined
    return (
      <div
        className={`relative aspect-[16/10] overflow-hidden rounded-xl ${item.imageUrl ? '' : (cls || 'bg-gradient-to-br from-zinc-800 to-black')}`}
        style={style}
      >
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <p className="text-sm font-bold text-white">{userName}</p>
          <p className="text-[10px] text-zinc-300">Profile của bạn</p>
        </div>
      </div>
    )
  }
  if (item.type === 'chat_color') {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-xl bg-gradient-to-br from-zinc-900 via-neutral-950 to-black p-4">
        <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
          <p className="text-xs font-semibold text-white">{userName}</p>
          <p className={`mt-1 text-sm font-medium ${cls}`}>Đây là bình luận với màu chữ này.</p>
        </div>
      </div>
    )
  }
  if (item.type === 'name_effect') {
    return (
      <div className="flex aspect-[16/10] items-center justify-center rounded-xl bg-gradient-to-br from-zinc-900 via-neutral-950 to-black">
        <span className={`text-2xl ${cls}`}>{userName}</span>
      </div>
    )
  }
  return (
    <div className="grid aspect-[16/10] place-items-center rounded-xl bg-zinc-900 text-xs text-zinc-500">
      {item.type}
    </div>
  )
}
