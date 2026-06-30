import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as notificationApi from '../services/notificationApi'
import { useAuth } from './useAuth'
import { NotificationContext } from './notificationContext.js'

/**
 * Context chia sẻ unread count + cache lần fetch gần nhất giữa popup và page noti.
 *
 * - Popup gọi `bumpRead(id)` ngay khi user click → state unread đồng bộ instant.
 * - Page noti gọi `markAllRead()` → tự re-pull count.
 * - Re-fetch unread count mỗi 90s (giữ behavior cũ của legacy NotificationBell).
 *
 * Fix bug: popup mark-read trước đây chỉ update local state, page noti dùng state riêng
 * nên hiển thị mismatch. Nay cả 2 đọc cùng `unreadCount` từ context.
 */
export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastFetchedAt, setLastFetchedAt] = useState(0)
  const pollRef = useRef(null)

  const refreshUnread = useCallback(async () => {
    if (!user) {
      setUnreadCount(0)
      return 0
    }
    try {
      const n = await notificationApi.getUnreadCount()
      setUnreadCount(n)
      setLastFetchedAt(Date.now())
      return n
    } catch {
      return unreadCount
    }
  }, [user, unreadCount])

  // Mark 1 noti đã đọc — gọi API + decrement counter
  const markRead = useCallback(async (id) => {
    try {
      await notificationApi.markNotificationRead(id)
    } catch {
      /* swallow — popup vẫn navigate */
    }
    setUnreadCount((c) => Math.max(0, c - 1))
  }, [])

  // Mark all read → reset counter về 0
  const markAllRead = useCallback(async () => {
    try {
      await notificationApi.markAllRead()
    } catch {
      /* ignore */
    }
    setUnreadCount(0)
  }, [])

  // Force refresh sau khi page noti reload list
  const invalidate = useCallback(() => {
    refreshUnread()
  }, [refreshUnread])

  useEffect(() => {
    if (!user) {
      setUnreadCount(0)
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
      return
    }
    refreshUnread()
    pollRef.current = setInterval(() => refreshUnread(), 90_000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const value = useMemo(() => ({
    unreadCount,
    lastFetchedAt,
    refreshUnread,
    markRead,
    markAllRead,
    invalidate,
  }), [unreadCount, lastFetchedAt, refreshUnread, markRead, markAllRead, invalidate])

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}
