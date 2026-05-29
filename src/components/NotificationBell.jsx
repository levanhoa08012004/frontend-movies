import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as notificationApi from '../services/notificationApi'

export default function NotificationBell() {
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    let alive = true
    async function poll() {
      try {
        const d = await notificationApi.listNotifications({ page: 0, size: 40 })
        if (!alive) return
        const n = (d.content || []).filter((x) => !x.readAt).length
        setUnread(n)
      } catch {
        if (!alive) return
        setUnread(0)
      }
    }
    poll()
    const id = window.setInterval(poll, 90_000)
    return () => {
      alive = false
      window.clearInterval(id)
    }
  }, [])

  return (
    <Link
      to="/notifications"
      className="relative flex size-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-200 transition hover:border-brand-coral/35 hover:bg-brand-coral/10 hover:text-white"
      aria-label="Thông báo"
    >
      <svg className="size-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.85}
          d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.454 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
        />
      </svg>
      {unread > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-coral px-1 text-[10px] font-bold leading-none text-white ring-2 ring-zinc-950">
          {unread > 9 ? '9+' : unread}
        </span>
      ) : null}
    </Link>
  )
}
