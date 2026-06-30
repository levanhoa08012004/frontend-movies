import { useEffect, useState } from 'react'
import { myEquipped, userEquipped } from '../services/cosmeticApi'
import { useAuth } from './useAuth.js'

let _meCache = null
let _meUserId = null
const _userCache = new Map()  // userId -> { data, ts }

const TTL_MS = 60_000

// Pub-sub đơn giản: mỗi useMyCosmetics() subscribe; equip()/invalidate() emit.
const _meSubscribers = new Set()
function _notifyMe() {
  _meSubscribers.forEach((cb) => { try { cb() } catch { /* ignore */ } })
}

export function invalidateMyCosmetics() {
  _meCache = null
  if (_meUserId != null) _userCache.delete(_meUserId)
  _notifyMe()
}

export function invalidateUserCosmetics(userId) {
  _userCache.delete(userId)
}

/** Map type → item của user hiện tại. Re-fetch tự động khi có invalidate(). */
export function useMyCosmetics() {
  const { user } = useAuth()
  const [data, setData] = useState(_meCache)
  const [loading, setLoading] = useState(!_meCache)
  const [bump, setBump] = useState(0)

  // Đăng ký subscriber để invalidate() trigger re-render
  useEffect(() => {
    const cb = () => setBump((n) => n + 1)
    _meSubscribers.add(cb)
    return () => { _meSubscribers.delete(cb) }
  }, [])

  useEffect(() => {
    if (!user) {
      // Logout / chưa đăng nhập — xoá cache để lần login sau không lấy nhầm user cũ.
      _meCache = null
      _meUserId = null
      setData(null)
      setLoading(false)
      return
    }
    // Round 19: cache key theo user.id — nếu cache đang lưu user khác (vừa đổi tài
    // khoản đăng nhập), bỏ cache & re-fetch. Trước đây _meCache "ăn theo" user_id
    // gần nhất nhưng không kiểm tra, gây bug: đăng nhập tài khoản B vẫn thấy
    // vật phẩm của A đến khi reload trang.
    if (_meUserId != null && _meUserId !== user.id) {
      _meCache = null
    }
    _meUserId = user.id
    if (_meCache) {
      setData(_meCache)
      setLoading(false)
      return
    }
    let alive = true
    setLoading(true)
    myEquipped()
      .then((d) => {
        _meCache = d || {}
        if (alive) setData(_meCache)
      })
      .catch(() => alive && setData({}))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [user?.id, bump])

  return { equipped: data || {}, loading }
}

/** Equipped items của user khác (hiển thị chéo trên comment). */
export function useUserCosmetics(userId) {
  const [data, setData] = useState({})

  useEffect(() => {
    if (!userId) return
    const cached = _userCache.get(userId)
    if (cached && Date.now() - cached.ts < TTL_MS && cached.data) {
      setData(cached.data)
      return
    }
    let alive = true
    userEquipped(userId)
      .then((d) => {
        _userCache.set(userId, { data: d || {}, ts: Date.now() })
        if (alive) setData(d || {})
      })
      .catch(() => alive && setData({}))
    return () => { alive = false }
  }, [userId])

  return data
}
