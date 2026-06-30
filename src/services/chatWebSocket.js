import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client/dist/sockjs.js'

/**
 * Singleton STOMP client cho chat realtime. Lazy connect khi component đầu
 * tiên subscribe. Mỗi subscription được track để cleanup khi unsubscribe.
 *
 * Pattern:
 *   const id = chatWS.subscribe('/topic/conversation.42', msg => ...)
 *   chatWS.unsubscribe(id)
 *
 * Connection sống suốt phiên đăng nhập. Khi tất cả subscription đóng, client
 * vẫn giữ connect (cheaper than reconnect khi user mở/đóng widget liên tục).
 */
function currentToken() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem('accessToken') || ''
}

class ChatWebSocket {
  constructor() {
    this.client = null
    this.connected = false
    this.pending = [] // { destination, callback, resolve }
    this.subs = new Map() // id → stomp subscription
    this.callbackById = new Map() // id → { destination, callback } để re-subscribe sau reconnect
    this._nextId = 1
    this.tokenAtConnect = ''
  }

  _ensureClient() {
    if (this.client) return
    // SockJS phải tới đúng Spring backend (Vite dev :5173 KHÔNG proxy WS).
    // Đồng nhất env var với api.js (VITE_API_URL).
    const base = (import.meta?.env?.VITE_API_URL || 'http://localhost:8080').replace(/\/+$/, '')
    const url = `${base}/ws/chat`
    const token = currentToken()
    this.tokenAtConnect = token
    this.client = new Client({
      webSocketFactory: () => new SockJS(url),
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        this.connected = true
        // eslint-disable-next-line no-console
        console.log('[chatWS] ✓ CONNECTED, re-subscribe', this.callbackById.size, 'channels')
        // Re-subscribe TẤT CẢ channel đã đăng ký, không chỉ pending.
        this.subs.clear()
        this.pending = []
        for (const [id, { destination, callback }] of this.callbackById.entries()) {
          const sub = this.client.subscribe(destination, (m) => {
            // eslint-disable-next-line no-console
            console.log('[chatWS] ← message on', m.headers?.destination, m.body)
            try {
              const body = m.body ? JSON.parse(m.body) : null
              callback(body)
            } catch {
              callback(m.body)
            }
          })
          this.subs.set(id, sub)
          // eslint-disable-next-line no-console
          console.log('[chatWS] ► subscribed', destination)
        }
      },
      onWebSocketClose: (ev) => {
        // eslint-disable-next-line no-console
        console.warn('[chatWS] ✗ socket closed', ev?.code, ev?.reason)
        this.connected = false
      },
      onStompError: (frame) => {
        // eslint-disable-next-line no-console
        console.warn('[chatWS] STOMP error', frame?.headers?.message)
        this.connected = false
      },
    })
    this.client.activate()
  }

  subscribe(destination, callback) {
    // Token đổi (login/logout/đổi tài khoản) → reset client để CONNECT lại
    // với header Authorization mới, đồng thời re-subscribe các channel cũ.
    if (this.client && this.tokenAtConnect !== currentToken()) {
      this._reset()
    }
    this._ensureClient()
    const id = this._nextId++
    this.callbackById.set(id, { destination, callback })
    if (this.connected) {
      const sub = this.client.subscribe(destination, (m) => {
        try {
          const body = m.body ? JSON.parse(m.body) : null
          callback(body)
        } catch {
          callback(m.body)
        }
      })
      this.subs.set(id, sub)
    } else {
      this.pending.push({ id, destination, callback })
    }
    return id
  }

  unsubscribe(id) {
    const sub = this.subs.get(id)
    if (sub) {
      try { sub.unsubscribe() } catch { /* ignore */ }
      this.subs.delete(id)
    } else {
      this.pending = this.pending.filter((p) => p.id !== id)
    }
    this.callbackById.delete(id)
  }

  /** Gửi STOMP SEND tới destination (vd /app/support/typing). No-op nếu chưa connect. */
  publish(destination, body) {
    if (this.client && this.connected) {
      try {
        this.client.publish({
          destination,
          body: typeof body === 'string' ? body : JSON.stringify(body),
        })
      } catch { /* ignore */ }
    }
  }

  _reset() {
    if (this.client) {
      try { this.client.deactivate() } catch { /* ignore */ }
    }
    this.client = null
    this.connected = false
    // Giữ callbackById — onConnect lần sau sẽ re-subscribe từ master list.
    this.pending = []
    this.subs.clear()
  }

  disconnect() {
    if (this.client) {
      try { this.client.deactivate() } catch { /* ignore */ }
      this.client = null
      this.connected = false
      this.pending = []
      this.subs.clear()
    }
  }
}

const chatWS = new ChatWebSocket()
export default chatWS
