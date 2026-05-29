import { useCallback, useEffect, useMemo, useState } from 'react'
import * as authService from '../services/authService'
import { AuthContext } from './authContext.js'

function mapUser(record) {
  if (!record) return null
  const roleRaw = record.role
  const role =
    typeof roleRaw === 'string'
      ? roleRaw
      : roleRaw?.name || roleRaw?.toString?.() || 'USER'
  return {
    id: String(record.id),
    email: record.email,
    username: record.email,
    role: role === 'ADMIN' ? 'ADMIN' : 'USER',
    name: record.name || '',
    avatar: record.avatar,
    vipTier: record.vipTier,
    vipExpiresAt: record.vipExpiresAt,
    isActive: record.isActive,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(true)

  const refreshUser = useCallback(async () => {
    const me = await authService.fetchCurrentUser()
    setUser(mapUser(me))
  }, [])

  const login = useCallback(
    async (email, password) => {
      await authService.login(email, password)
      await refreshUser()
    },
    [refreshUser]
  )

  const loginWithGoogle = useCallback(
    async (idToken) => {
      await authService.loginWithGoogleIdToken(idToken)
      await refreshUser()
    },
    [refreshUser]
  )

  const logout = useCallback(async () => {
    await authService.logoutApi()
    setUser(null)
  }, [])

  /** Xóa JWT cục bộ + user (sau đổi mật khẩu server đã xóa token — không gọi được logout API). */
  const clearLocalSession = useCallback(() => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    setUser(null)
  }, [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        if (!authService.getStoredAccessToken()) {
          if (alive) setInitializing(false)
          return
        }
        const me = await authService.fetchCurrentUser()
        if (alive) setUser(mapUser(me))
      } catch {
        if (alive) setUser(null)
      } finally {
        if (alive) setInitializing(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      initializing,
      login,
      loginWithGoogle,
      logout,
      refreshUser,
      clearLocalSession,
    }),
    [user, initializing, login, loginWithGoogle, logout, refreshUser, clearLocalSession]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
