import { useCallback, useEffect, useMemo, useState } from 'react'
import * as authService from '../services/authService'
import { AuthContext } from './authContext.js'

const KNOWN_ROLES = new Set(['ADMIN', 'CARE', 'USER'])

function mapUser(record) {
  if (!record) return null
  const roleRaw = record.role
  const rawStr =
    typeof roleRaw === 'string'
      ? roleRaw
      : roleRaw?.name || roleRaw?.toString?.() || 'USER'
  const normalized = String(rawStr).toUpperCase()
  // Giữ nguyên role nếu thuộc tập biết trước (ADMIN/CARE/USER) — trước đây
  // mọi role ≠ ADMIN bị collapse về USER khiến CARE không vào được dashboard.
  const role = KNOWN_ROLES.has(normalized) ? normalized : 'USER'
  return {
    id: String(record.id),
    email: record.email,
    username: record.email,
    role,
    name: record.name || '',
    avatar: record.avatar,
    vipTier: record.vipTier,
    vipExpiresAt: record.vipExpiresAt,
    isActive: record.isActive,
    // R57 — profile mở rộng
    dob: record.dob || null,
    phone: record.phone || '',
    gender: record.gender || null,
    address: record.address || '',
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initializing, setInitializing] = useState(true)

  const refreshUser = useCallback(async () => {
    const me = await authService.fetchCurrentUser()
    const mapped = mapUser(me)
    setUser(mapped)
    return mapped
  }, [])

  // Round 19 — Phòng cache lệch sau khi đổi user (đăng nhập lại / đổi tài khoản).
  // useMyCosmetics/useVipBenefits đều cache theo singleton; phải invalidate trước
  // khi refresh để useEffect re-fetch đúng tài khoản mới.
  async function _resetUserScopedCaches() {
    try {
      const mod = await import('./useUserCosmetics.js')
      mod.invalidateMyCosmetics?.()
    } catch { /* module chưa được dùng — ignore */ }
    try {
      const mod = await import('./useVipBenefits.js')
      mod.invalidateVipBenefitsCache?.()
    } catch { /* ignore */ }
    try {
      // AiSearchCard cache sessionStorage — không kèm userId trong key cũ →
      // user khác đăng nhập vẫn thấy gợi ý của user cũ.
      const mod = await import('../components/AiSearchCard.jsx')
      mod.invalidateAiSearchCache?.()
    } catch { /* ignore */ }
  }

  const login = useCallback(
    async (email, password) => {
      await authService.login(email, password)
      await _resetUserScopedCaches()
      return await refreshUser()
    },
    [refreshUser]
  )

  const loginWithGoogle = useCallback(
    async (idToken) => {
      await authService.loginWithGoogleIdToken(idToken)
      await _resetUserScopedCaches()
      return await refreshUser()
    },
    [refreshUser]
  )

  const logout = useCallback(async () => {
    await authService.logoutApi()
    await _resetUserScopedCaches()
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

  // Guest semantics: khi không có JWT hợp lệ → user = null. Frontend đối xử như
  // role GUEST (chỉ xem catalog công khai, không xem phim, không cá nhân hoá).
  const isGuest = !initializing && !user
  const effectiveRole = user?.role || (initializing ? null : 'GUEST')

  const value = useMemo(
    () => ({
      user,
      initializing,
      login,
      loginWithGoogle,
      logout,
      refreshUser,
      clearLocalSession,
      isGuest,
      effectiveRole,
    }),
    [user, initializing, login, loginWithGoogle, logout, refreshUser, clearLocalSession, isGuest, effectiveRole]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
