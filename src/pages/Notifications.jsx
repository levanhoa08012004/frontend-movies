import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as notificationApi from '../services/notificationApi'
import { useNotifications } from '../context/useNotifications'

function fmtTime(iso) {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return String(iso)
  }
}

function fmtRel(iso) {
  if (!iso) return ''
  try {
    const ts = new Date(iso).getTime()
    const diff = Math.max(0, Date.now() - ts)
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'vừa xong'
    if (m < 60) return `${m} phút trước`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h} giờ trước`
    const d = Math.floor(h / 24)
    if (d < 7) return `${d} ngày trước`
    return new Date(ts).toLocaleDateString('vi-VN')
  } catch {
    return ''
  }
}

// Tone + icon theo loại noti
function categoryStyle(type) {
  switch (type) {
    case 'VIP_PURCHASED':
    case 'NEW_VIP_PLAN':
      return { bg: 'bg-amber-500/15', fg: 'text-amber-400', ring: 'ring-amber-400/30', icon: 'crown' }
    case 'VIP_EXPIRING':
      return { bg: 'bg-orange-500/15', fg: 'text-orange-400', ring: 'ring-orange-400/30', icon: 'clock' }
    case 'VIP_EXPIRED':
      return { bg: 'bg-red-500/15', fg: 'text-red-400', ring: 'ring-red-400/30', icon: 'alert' }
    case 'BROADCAST':
      return { bg: 'bg-sky-500/15', fg: 'text-sky-400', ring: 'ring-sky-400/30', icon: 'megaphone' }
    case 'NEW_MOVIE':
    default:
      return { bg: 'bg-brand-coral/15', fg: 'text-brand-coral', ring: 'ring-brand-coral/30', icon: 'film' }
  }
}

function CategoryIcon({ type }) {
  const cls = 'h-5 w-5'
  switch (type) {
    case 'VIP_PURCHASED':
    case 'NEW_VIP_PLAN':
      return <svg className={cls} fill="currentColor" viewBox="0 0 24 24"><path d="M5 16L3 5l5.5 4L12 3l3.5 6L21 5l-2 11H5zm0 2h14v3H5v-3z" /></svg>
    case 'VIP_EXPIRING':
      return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
    case 'VIP_EXPIRED':
      return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
    case 'BROADCAST':
      return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5z" /></svg>
    case 'NEW_MOVIE':
    default:
      return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 5v14M17 5v14M3 10h4M3 14h4M17 10h4M17 14h4" /></svg>
  }
}

export default function Notifications() {
  const navigate = useNavigate()
  const { unreadCount, refreshUnread, markRead, markAllRead } = useNotifications()
  const [tab, setTab] = useState('unread') // 'unread' | 'read' | 'all'
  const [pg, setPg] = useState({ content: [], totalPages: 0 })
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)

  async function load(filter, p) {
    setLoading(true)
    try {
      const d = await notificationApi.listNotifications({ page: p, size: 20, filter })
      setPg({ content: d.content || [], totalPages: d.totalPages ?? 1 })
      setPage(d.number ?? p)
    } catch {
      setPg({ content: [], totalPages: 1 })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    document.title = 'Thông báo — VieStream'
    refreshUnread().catch(() => {})
  }, [refreshUnread])

  useEffect(() => {
    load(tab, 0).catch(() => {})
  }, [tab])

  const rows = pg.content || []

  const handleItemClick = async (n) => {
    if (!n.readAt) {
      await markRead(n.id)
      // Optimistic: cập nhật local list
      setPg((prev) => ({
        ...prev,
        content: prev.content.map((it) => (it.id === n.id ? { ...it, readAt: new Date().toISOString() } : it)),
      }))
    }
    if (n.linkUrl) navigate(n.linkUrl)
    else if (n.movieId) navigate(`/phim/${n.movieId}`)
  }

  const handleMarkAllRead = async () => {
    await markAllRead()
    await load(tab, 0)
    await refreshUnread()
  }

  const TabBtn = ({ value, label, count }) => (
    <button
      type="button"
      onClick={() => setTab(value)}
      className={`relative rounded-full px-5 py-2 text-sm font-semibold transition ${
        tab === value
          ? 'bg-brand-coral text-white shadow-lg shadow-brand-coral/30'
          : 'text-zinc-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      {label}
      {count != null && count > 0 ? (
        <span
          className={`ml-2 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
            tab === value ? 'bg-white/25 text-white' : 'bg-brand-coral/20 text-brand-coral'
          }`}
        >
          {count > 99 ? '99+' : count}
        </span>
      ) : null}
    </button>
  )

  return (
    <div className="relative mx-auto max-w-[820px] px-5 pb-24 pt-8 sm:px-8 lg:pb-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_85%_60%_at_70%_-10%,rgba(225,29,72,0.12),transparent)]" />

      <div className="relative mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-brand-coral/35 bg-brand-coral/15 text-brand-coral">
            <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.454 1.31" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-white md:text-4xl">Thông báo</h1>
            <p className="mt-1.5 text-sm text-zinc-500">
              {unreadCount > 0 ? (
                <>
                  <span className="font-semibold text-brand-coral">{unreadCount} chưa đọc</span> · Cập nhật real-time qua chuông menu trên
                </>
              ) : (
                <>Tất cả tin đã đọc.</>
              )}
            </p>
          </div>
        </div>
        <Link
          to="/dashboard"
          className="self-start rounded-full border border-white/12 px-5 py-2 text-sm font-semibold text-zinc-300 hover:border-brand-coral/35"
        >
          Trang chủ
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 p-1">
          <TabBtn value="unread" label="Chưa đọc" count={unreadCount} />
          <TabBtn value="read" label="Đã đọc" />
          <TabBtn value="all" label="Tất cả" />
        </div>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-zinc-300 hover:border-brand-coral/40 hover:text-white"
          >
            ✓ Đánh dấu tất cả đã đọc
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="space-y-3 py-4">
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="animate-pulse rounded-2xl border border-white/[0.06] bg-brand-panel p-5">
              <div className="flex gap-3">
                <div className="size-10 shrink-0 rounded-xl bg-zinc-800" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-zinc-800" />
                  <div className="h-3 w-full rounded bg-zinc-800/80" />
                  <div className="h-3 w-2/3 rounded bg-zinc-800/60" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/15 bg-black/30 px-8 py-16 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-white/5 text-zinc-500">
            <svg className="size-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.454 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
          </div>
          <p className="font-display text-lg text-zinc-300">
            {tab === 'unread' ? 'Không có thông báo chưa đọc' : tab === 'read' ? 'Chưa có thông báo nào đã đọc' : 'Chưa có thông báo'}
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            {tab === 'unread' ? 'Mọi tin đã được xem.' : 'Khi có sự kiện mới, tin sẽ hiển thị ở đây.'}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((n) => {
            const isNew = !n.readAt
            const style = categoryStyle(n.type)
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => handleItemClick(n)}
                  className={`group block w-full overflow-hidden rounded-2xl border text-left transition ${
                    isNew
                      ? 'border-brand-coral/30 bg-gradient-to-r from-brand-coral/[0.08] to-brand-panel shadow-lg shadow-black/30 hover:border-brand-coral/50'
                      : 'border-white/[0.06] bg-brand-panel hover:border-white/15 hover:bg-brand-panel/80'
                  }`}
                >
                  <div className="flex gap-4 p-5">
                    <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ring-1 ${style.bg} ${style.fg} ${style.ring}`}>
                      <CategoryIcon type={n.type} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="font-display text-base font-bold text-white md:text-lg">{n.title}</h2>
                        {isNew ? (
                          <span className="shrink-0 rounded-full bg-brand-coral px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                            Mới
                          </span>
                        ) : null}
                      </div>
                      {n.categoryName ? (
                        <p className={`mt-0.5 text-[11px] font-semibold uppercase tracking-wide ${style.fg}`}>
                          {n.categoryName}
                        </p>
                      ) : null}
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">{n.body}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-wide text-zinc-600">
                        <span title={fmtTime(n.createdAt)}>{fmtRel(n.createdAt)}</span>
                        {n.readAt ? <span>· Đã đọc {fmtRel(n.readAt)}</span> : null}
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {pg.totalPages > 1 ? (
        <div className="mt-10 flex justify-center gap-6 border-t border-white/10 pt-8">
          <button
            type="button"
            disabled={page <= 0 || loading}
            className="rounded-xl border border-white/15 px-5 py-2 text-sm font-semibold disabled:opacity-40 hover:border-brand-coral/40"
            onClick={() => load(tab, page - 1)}
          >
            ← Trước
          </button>
          <span className="flex items-center text-sm text-zinc-400">
            Trang <strong className="mx-1 text-white">{page + 1}</strong> / {pg.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= pg.totalPages - 1 || loading}
            className="rounded-xl border border-white/15 px-5 py-2 text-sm font-semibold disabled:opacity-40 hover:border-brand-coral/40"
            onClick={() => load(tab, page + 1)}
          >
            Tiếp →
          </button>
        </div>
      ) : null}
    </div>
  )
}
