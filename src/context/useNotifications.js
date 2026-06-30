import { useContext } from 'react'
import { NotificationContext } from './notificationContext.js'

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) {
    // Fallback an toàn khi component dùng hook ngoài provider (vd test isolation)
    return {
      unreadCount: 0,
      lastFetchedAt: 0,
      refreshUnread: () => Promise.resolve(0),
      markRead: () => Promise.resolve(),
      markAllRead: () => Promise.resolve(),
      invalidate: () => {},
    }
  }
  return ctx
}
