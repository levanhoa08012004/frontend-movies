import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as notificationApi from '../services/notificationApi'

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

export default function Notifications() {
  const [pg, setPg] = useState({ content: [], totalPages: 0 })
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)

  async function load(p) {
    setLoading(true)
    try {
      const d = await notificationApi.listNotifications({ page: p, size: 20 })
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
    load(0).catch(() => {})
  }, [])

  const unread = (pg.content || []).filter((n) => !n.readAt)
  const rows = pg.content || []

  return (
    <div className="relative mx-auto max-w-[800px] px-5 pb-24 pt-8 sm:px-8 lg:pb-28">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_85%_60%_at_70%_-10%,rgba(225,29,72,0.12),transparent)]" />

      <div className="relative mb-10 flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-brand-coral/35 bg-brand-coral/15 text-brand-coral">
              <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.454 1.31" />
              </svg>
            </div>
            <div>
              <h1 className="font-display text-4xl font-bold text-white md:text-[2.65rem]">Thông báo</h1>
              <p className="mt-2 text-[15px] text-zinc-500">
                {unread.length ? (
                  <>
                    <span className="font-semibold text-brand-coral">{unread.length} chưa đọc</span> · Chuông trên menu trên luôn cập nhật
                  </>
                ) : (
                  <>Mọi mục hiện tại đã xem hoặc hộp thư trống.</>
                )}
              </p>
            </div>
          </div>
        </div>
        <Link
          to="/dashboard"
          className="rounded-full border border-white/12 px-5 py-2.5 text-sm font-semibold text-zinc-300 hover:border-brand-coral/35"
        >
          Về trang chủ
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4 py-12">
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="animate-pulse rounded-2xl border border-white/[0.06] bg-brand-panel p-7">
              <div className="h-6 w-1/3 rounded bg-zinc-800" />
              <div className="mt-4 h-4 w-full rounded bg-zinc-800/80" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/15 bg-black/30 px-8 py-20 text-center">
          <p className="font-display text-xl text-zinc-400">Chưa có thông báo</p>
          <p className="mt-2 text-sm text-zinc-600">Khi có sự kiện tài khoản hoặc hệ thống, tin sẽ xuất hiện đây.</p>
          <Link to="/dashboard" className="mt-8 inline-flex text-brand-coral hover:underline">
            Quay về trang chủ
          </Link>
        </div>
      ) : (
        <ul className="space-y-5">
          {rows.map((n) => {
            const isNew = !n.readAt
            return (
              <li
                key={n.id}
                className={`relative overflow-hidden rounded-2xl border transition ${
                  isNew ? 'border-l-4 border-l-brand-coral border-white/[0.1] bg-gradient-to-r from-brand-coral/[0.08] to-brand-panel shadow-lg shadow-black/35' : 'border-white/[0.07] bg-brand-panel hover:border-white/12'
                }`}
              >
                {!isNew ? null : (
                  <span className="absolute right-6 top-6 rounded-full bg-brand-coral px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Mới
                  </span>
                )}
                <div className="p-7 pr-28">
                  <h2 className="font-display text-lg font-bold leading-snug text-white md:text-xl">{n.title}</h2>
                  <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-400">{n.body}</p>
                  <p className="mt-5 flex flex-wrap gap-x-3 gap-y-1 text-xs uppercase tracking-wide text-zinc-600">
                    <span>{fmtTime(n.createdAt)}</span>
                    {n.readAt ? <span className="text-zinc-500">Đã đọc {fmtTime(n.readAt)}</span> : null}
                  </p>
                  {isNew ? (
                    <button
                      type="button"
                      className="mt-6 rounded-xl border border-brand-coral/35 bg-brand-coral/15 px-5 py-2.5 text-sm font-semibold text-brand-coral hover:bg-brand-coral/25"
                      onClick={async () => {
                        await notificationApi.markNotificationRead(n.id)
                        await load(page).catch(() => {})
                      }}
                    >
                      Đánh dấu đã đọc
                    </button>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {pg.totalPages > 1 ? (
        <div className="mt-14 flex justify-center gap-8 border-t border-white/10 pt-10">
          <button
            type="button"
            disabled={page <= 0 || loading}
            className="min-h-[48px] min-w-[100px] rounded-xl border border-white/15 px-6 text-lg font-semibold disabled:opacity-40"
            onClick={() => load(page - 1)}
          >
            ←
          </button>
          <span className="flex items-center text-lg text-zinc-400">
            Trang <strong className="text-white">{page + 1}</strong> / {pg.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= pg.totalPages - 1 || loading}
            className="min-h-[48px] min-w-[100px] rounded-xl border border-white/15 px-6 text-lg font-semibold disabled:opacity-40"
            onClick={() => load(page + 1)}
          >
            →
          </button>
        </div>
      ) : null}
    </div>
  )
}