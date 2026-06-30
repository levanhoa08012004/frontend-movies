import { useEffect, useState } from 'react'
import { vipBenefitsMatrix } from '../services/paymentApi'
import { useAuth } from './useAuth.js'

let _cache = null

export function invalidateVipBenefitsCache() {
  _cache = null
}

/**
 * Trả benefits của tier user hiện tại.
 *
 * Usage:
 *   const { benefits, loading } = useVipBenefits()
 *   const maxHeight = benefits?.MAX_VIDEO_HEIGHT ?? 720
 *   const canSpeed = !!benefits?.PLAYBACK_SPEED_UNLOCKED
 */
export function useVipBenefits() {
  const { user } = useAuth()
  const [data, setData] = useState(_cache)
  const [loading, setLoading] = useState(!_cache)

  useEffect(() => {
    if (_cache) {
      setData(_cache)
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    vipBenefitsMatrix()
      .then((d) => {
        _cache = d
        if (alive) setData(d)
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  const tier = user?.vipTier || 'NONE'
  const tierBenefits = data?.matrix?.[tier] || {}

  return {
    loading,
    tier,
    benefits: tierBenefits,
    definitions: data?.definitions || [],
    tiers: data?.tiers || [],
    matrix: data?.matrix || {},
  }
}

/** Shortcut đọc 1 benefit. */
export function useBenefit(code, defaultValue = null) {
  const { benefits } = useVipBenefits()
  if (benefits == null || benefits[code] == null) return defaultValue
  return benefits[code]
}
