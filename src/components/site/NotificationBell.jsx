import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as notificationApi from '../../services/notificationApi'
import { useNotifications } from '../../context/useNotifications'

function fmtRel(iso) {
  if (!iso) return ''
  try {
    const ts = new Date(iso).getTime()
    const diff = Math.max(0, Date.now() - ts)
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'vừa xong'
    if (m < 60) return `${m} phút`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h} giờ`
    const d = Math.floor(h / 24)
    if (d < 7) return `${d} ngày`
    return new Date(ts).toLocaleDateString('vi-VN')
  } catch {
    return ''
  }
}

// Icon mapping cho từng loại noti
function NotiIcon({ type }) {
  const cls = 'h-4 w-4 shrink-0'
  switch (type) {
    case 'VIP_PURCHASED':
    case 'NEW_VIP_PLAN':
      return <svg className={cls} fill="currentColor" viewBox="0 0 24 24"><path d="M5 16L3 5l5.5 4L12 3l3.5 6L21 5l-2 11H5zm0 2h14v3H5v-3z" /></svg>
    case 'VIP_EXPIRING':
      return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
    case 'VIP_EXPIRED':
      return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
    case 'BROADCAST':
      return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 5L6 9H2v6h4l5 4V5zM19 12a4 4 0 00-2-3.5" /></svg>
    case 'NEW_MOVIE':
    default:
      return <svg className={cls} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 5v14M17 5v14M3 10h4M3 14h4M17 10h4M17 14h4" /></svg>
  }
}

/**
 * Round 17 — Bell với hover dropdown preview + click navigate sang /notifications.
 * R57 — Đồng bộ unread count qua NotificationContext (popup ↔ page share state).
 *
 * Hover/focus → load 5 noti gần nhất + render dropdown.
 * Click bell → navigate /notifications page.
 * Click 1 item trong dropdown → AWAIT mark-as-read (decrement counter) + navigate.
 */
export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const wrapRef = useRef(null)
  const hideTimer = useRef(null)
  const { unreadCount, markRead, refreshUnread } = useNotifications()

  const fetchPreview = async () => {
    if (loading) return
    setLoading(true)
    try {
      const d = await notificationApi.listNotifications({ page: 0, size: 5 })
      setItems(d.content || [])
      setLoaded(true)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  // Mỗi lần mở popup → re-fetch để hiện noti mới nhất
  useEffect(() => {
    if (open) fetchPreview().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Click outside để close
  useEffect(() => {
    const onClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const showWith = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    setOpen(true)
  }
  const hideSoon = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setOpen(false), 250)
  }

  const onBellClick = (e) => {
    e.preventDefault()
    navigate('/notifications')
  }

  // FIX: await mark-read TRƯỚC khi navigate để page noti fetch fresh đúng state.
  // Đồng thời cập nhật local items + global unreadCount qua context.
  const onItemClick = async (n, e) => {
    e.preventDefault()
    if (!n.readAt) {
      await markRead(n.id) // context giảm counter + gọi API
      setItems((prev) => prev.map((it) => (it.id === n.id ? { ...it, readAt: new Date().toISOString() } : it)))
    }
    setOpen(false)
    // Ưu tiên linkUrl từ backend (R57 — categories có thể chỉ định route)
    if (n.linkUrl) {
      navigate(n.linkUrl)
    } else if (n.movieId) {
      navigate(`/phim/${n.movieId}`)
    } else {
      navigate('/notifications')
    }
  }

  return (
    <div
      ref={wrapRef}
      onMouseEnter={showWith}
      onMouseLeave={hideSoon}
      className="relative"
    >
      <button
        type="button"
        onClick={onBellClick}
        className="relative text-zinc-300 hover:text-white"
        aria-label="Thông báo"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0" />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -right-1.5 -top-1 grid h-4 min-w-[1rem] place-items-center rounded-full bg-brand-coral px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="absolute right-0 top-10 z-50 w-[380px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl"
          onMouseEnter={showWith}
          onMouseLeave={hideSoon}
        >
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
            <p className="text-sm font-semibold text-white">Thông báo</p>
            <span className="text-xs text-zinc-500">{unreadCount} chưa đọc</span>
          </div>

          {loading && !loaded ? (
            <div className="space-y-2 p-3">
              {[1, 2, 3].map((k) => (
                <div key={k} className="animate-pulse rounded-md bg-zinc-900/70 p-3">
                  <div className="h-3 w-2/3 rounded bg-zinc-800" />
                  <div className="mt-2 h-3 w-full rounded bg-zinc-800/70" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-zinc-500">
              Chưa có thông báo nào.
            </div>
          ) : (
            <ul className="max-h-[420px] overflow-y-auto">
              {items.map((n) => (
                <li key={n.id} className={`border-b border-zinc-900 last:border-b-0 ${!n.readAt ? 'bg-brand-coral/[0.04]' : ''}`}>
                  <a
                    href={n.linkUrl || '/notifications'}
                    onClick={(e) => onItemClick(n, e)}
                    className="flex gap-3 p-3 hover:bg-zinc-900/60"
                  >
                    <div className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg ${!n.readAt ? 'bg-brand-coral/20 text-brand-coral' : 'bg-zinc-900 text-zinc-500'}`}>
                      <NotiIcon type={n.type} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium text-white">{n.title}</p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-zinc-400">{n.body}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-wide text-zinc-600">{fmtRel(n.createdAt)}</p>
                    </div>
                    {!n.readAt ? <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-coral" /> : null}
                  </a>
                </li>
              ))}
            </ul>
          )}

          <div className="flex border-t border-zinc-800 bg-zinc-900/70">
            <button
              type="button"
              onClick={async () => {
                await notificationApi.markAllRead().catch(() => {})
                await refreshUnread()
                setItems((prev) => prev.map((it) => ({ ...it, readAt: it.readAt || new Date().toISOString() })))
              }}
              disabled={unreadCount === 0}
              className="flex-1 px-4 py-2.5 text-xs font-semibold text-zinc-400 hover:bg-zinc-900 disabled:opacity-40"
            >
              Đánh dấu tất cả đã đọc
            </button>
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="flex-1 px-4 py-2.5 text-center text-xs font-semibold text-brand-coral hover:bg-zinc-900"
            >
              Xem tất cả →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}
