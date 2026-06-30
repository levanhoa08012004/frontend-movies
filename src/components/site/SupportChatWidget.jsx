import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import * as supportApi from '../../services/supportChatApi'
import chatWS from '../../services/chatWebSocket'

/**
 * Floating chat bubble + popup hỗ trợ khách hàng.
 *
 * - Bubble nhỏ tròn ở góc dưới phải (z-40, không che modal).
 * - Click → mở panel (340×460 desktop, fullscreen mobile dưới sm).
 * - Subscribe topic /topic/conversation.{id} qua STOMP → tin nhắn realtime.
 * - Quick-reply suggestions hiển thị khi conversation rỗng hoặc tin cuối là CARE.
 * - Tự đánh dấu đã đọc khi panel mở.
 *
 * Chỉ hiển thị khi user đã đăng nhập + không phải CARE (CARE đăng nhập sẽ
 * trực tiếp dùng dashboard).
 */

const QUICK_REPLIES = [
  'Tôi cần hỗ trợ thanh toán VIP',
  'Phim không xem được, lỗi player',
  'Muốn đổi mật khẩu / email đăng nhập',
  'Yêu cầu hoàn tiền giao dịch',
  'Hỏi về đặc quyền gói VIP',
  'Có chương trình khuyến mãi gì không?',
]

export default function SupportChatWidget() {
  const { user, isGuest } = useAuth()
  const [open, setOpen] = useState(false)
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [careTyping, setCareTyping] = useState(false)
  const listRef = useRef(null)
  const subIdRef = useRef(null)
  const subTypingRef = useRef(null)
  const subReadRef = useRef(null)
  const typingEndRef = useRef(null)
  const lastTypingSentRef = useRef(0)

  // Không hiển thị cho guest hoặc CARE/ADMIN (admin có dashboard riêng)
  const role = user?.role
  const shouldShow = !isGuest && user && role !== 'CARE' && role !== 'ADMIN'

  const loadAll = useCallback(async () => {
    try {
      const c = await supportApi.getMyConversation()
      setConversation(c)
      const msgs = await supportApi.getMyMessages()
      setMessages(msgs)
    } catch {
      // user chưa đủ quyền hoặc network — bỏ qua
    }
  }, [])

  useEffect(() => {
    if (!shouldShow) return
    loadAll()
  }, [shouldShow, loadAll])

  // Subscribe WebSocket khi có conversation: 3 channel (message + typing + read)
  useEffect(() => {
    if (!conversation?.id || !shouldShow) return
    const cid = conversation.id
    subIdRef.current = chatWS.subscribe(`/topic/conversation.${cid}`, (msg) => {
      if (!msg) return
      setMessages((cur) => {
        if (msg.id && cur.some((m) => m.id === msg.id)) return cur
        return [...cur, msg]
      })
      // Có message từ CARE → CARE không còn đang gõ
      if (msg.senderRole === 'CARE') {
        setCareTyping(false)
        if (typingEndRef.current) clearTimeout(typingEndRef.current)
      }
      // CARE message tới khi widget đang ĐÓNG → tăng badge unread để user thấy
      if (msg.senderRole === 'CARE' && !open) {
        setConversation((c) => (c ? { ...c, unreadForUser: (c.unreadForUser || 0) + 1 } : c))
      }
    })
    subTypingRef.current = chatWS.subscribe(`/topic/conversation.${cid}.typing`, (ev) => {
      // Chỉ react khi bên kia (CARE) đang gõ
      if (!ev || ev.senderRole !== 'CARE') return
      setCareTyping(true)
      if (typingEndRef.current) clearTimeout(typingEndRef.current)
      typingEndRef.current = setTimeout(() => setCareTyping(false), 1500)
    })
    subReadRef.current = chatWS.subscribe(`/topic/conversation.${cid}.read`, (ev) => {
      // eslint-disable-next-line no-console
      console.log('[user-widget] ◀ read receipt', ev)
      // CARE đã đọc → mọi tin USER chưa có readAt được mark đã đọc
      if (!ev || ev.by !== 'CARE') return
      setMessages((cur) =>
        cur.map((m) =>
          m.senderRole === 'USER' && !m.readAt ? { ...m, readAt: ev.at || new Date().toISOString() } : m,
        ),
      )
    })
    return () => {
      if (subIdRef.current != null) chatWS.unsubscribe(subIdRef.current)
      if (subTypingRef.current != null) chatWS.unsubscribe(subTypingRef.current)
      if (subReadRef.current != null) chatWS.unsubscribe(subReadRef.current)
      subIdRef.current = subTypingRef.current = subReadRef.current = null
      if (typingEndRef.current) clearTimeout(typingEndRef.current)
    }
  }, [conversation?.id, shouldShow])

  // Throttled typing emit (max 1 lần / 1.5s)
  function emitTyping() {
    if (!conversation?.id) return
    const now = Date.now()
    if (now - lastTypingSentRef.current < 1500) return
    lastTypingSentRef.current = now
    chatWS.publish('/app/support/typing', {
      conversationId: conversation.id,
      senderRole: 'USER',
      senderName: user?.name || 'User',
    })
  }

  // Auto scroll bottom khi có tin mới HOẶC indicator typing xuất hiện
  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [messages, open, careTyping])

  // Mark read khi mở chat HOẶC khi có tin CARE mới đến mà panel đang mở
  // (đảm bảo CARE thấy tick đôi trên tin của họ ngay sau khi user thấy).
  // KHÔNG gate theo unreadForUser vì giá trị này có thể stale so với backend.
  useEffect(() => {
    if (!open || !conversation?.id) return
    // eslint-disable-next-line no-console
    console.log('[user-widget] ► mark read conv', conversation.id)
    supportApi.markMyConversationRead().catch((e) => {
      // eslint-disable-next-line no-console
      console.warn('[user-widget] mark read failed', e?.response?.status, e?.message)
    })
    setConversation((c) => (c ? { ...c, unreadForUser: 0 } : c))
  }, [open, conversation?.id, messages.length])

  async function doSend(text) {
    const content = (text ?? draft).trim()
    if (!content || sending) return
    setSending(true)
    setDraft('')
    // Optimistic
    const optimistic = {
      id: `tmp-${Date.now()}`,
      conversationId: conversation?.id,
      senderRole: 'USER',
      content,
      createdAt: new Date().toISOString(),
    }
    setMessages((cur) => [...cur, optimistic])
    try {
      const saved = await supportApi.sendMyMessage(content)
      setMessages((cur) => cur.map((m) => (m.id === optimistic.id ? saved : m)))
      // Cập nhật conversation id nếu lần đầu
      if (!conversation?.id) {
        const c = await supportApi.getMyConversation()
        setConversation(c)
      }
    } catch (e) {
      setMessages((cur) => cur.filter((m) => m.id !== optimistic.id))
      setDraft(content)
    } finally {
      setSending(false)
    }
  }

  if (!shouldShow) return null

  const unread = conversation?.unreadForUser ?? 0
  // Khi user CHƯA gửi tin nào → gợi ý 6 câu hỏi mẫu. User đã nhập 1 tin
  // → ẩn vĩnh viễn (kể cả khi CARE reply) — họ đang chat thật, không cần
  // câu mẫu nữa.
  const userHasSent = messages.some((m) => m.senderRole === 'USER')
  const showQuick = !userHasSent

  return (
    <>
      {/* Bubble */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Mở chat hỗ trợ"
          className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-coral text-white shadow-2xl shadow-brand-coral/40 transition hover:bg-rose-500"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden>
            <path d="M2 4a2 2 0 012-2h16a2 2 0 012 2v12a2 2 0 01-2 2H7l-5 4V4z" />
          </svg>
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 grid min-h-[20px] min-w-[20px] place-items-center rounded-full bg-white px-1 text-[11px] font-bold text-brand-coral shadow">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      )}

      {/* Panel */}
      {open && (
        <div className="fixed inset-0 z-40 flex items-end justify-end p-0 sm:bottom-5 sm:right-5 sm:inset-auto sm:p-0">
          <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-zinc-950 shadow-2xl shadow-black/60 sm:h-[460px] sm:w-[360px] sm:rounded-2xl sm:border sm:border-white/10">
            {/* Header */}
            <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] bg-gradient-to-r from-rose-600 to-pink-500 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-white/20 text-lg">🎬</span>
                <div className="leading-tight">
                  <p className="text-sm font-bold">Hỗ trợ VieStream</p>
                  <p className="text-[11px] opacity-80">
                    {conversation?.assigneeName ? `Đang chat: ${conversation.assigneeName}` : 'Phản hồi trong vài phút'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Đóng"
                className="rounded-full p-1 text-white/90 transition hover:bg-white/10"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
                </svg>
              </button>
            </header>

            {/* Messages */}
            <div
              ref={listRef}
              className="flex-1 space-y-2 overflow-y-auto bg-zinc-900/40 px-3 py-4"
            >
              {messages.length === 0 ? (
                <div className="text-center text-xs text-zinc-500">
                  <p className="mb-3 mt-6">Chào bạn! Chọn 1 câu hỏi mẫu hoặc nhập câu hỏi của riêng bạn.</p>
                </div>
              ) : null}
              {messages.map((m, idx) => {
                const prev = idx > 0 ? messages[idx - 1] : null
                const newDay = !prev || dayKey(prev.createdAt) !== dayKey(m.createdAt)
                const showAvatar = !prev || prev.senderRole !== m.senderRole
                return (
                  <MessageBubble
                    key={m.id}
                    m={m}
                    showAvatar={showAvatar}
                    dateLabel={newDay ? fmtDateLong(m.createdAt) : ''}
                  />
                )
              })}
              {careTyping ? <TypingDots label="Nhân viên đang gõ" /> : null}
            </div>

            {/* Quick replies */}
            {showQuick && (
              <div className="border-t border-white/[0.06] bg-zinc-900/60 px-3 py-2">
                <p className="mb-1.5 text-[10px] uppercase tracking-wider text-zinc-500">Câu hỏi mẫu</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_REPLIES.map((q) => (
                    <button
                      key={q}
                      onClick={() => doSend(q)}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-zinc-300 transition hover:border-brand-coral/40 hover:text-white"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                doSend()
              }}
              className="flex items-center gap-2 border-t border-white/[0.06] bg-zinc-950 px-3 py-2"
            >
              <input
                value={draft}
                onChange={(e) => { setDraft(e.target.value); if (e.target.value) emitTyping() }}
                placeholder="Nhập tin nhắn…"
                maxLength={4000}
                className="min-w-0 flex-1 rounded-full border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-brand-coral/40 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending}
                className="grid h-9 w-9 place-items-center rounded-full bg-brand-coral text-white transition hover:bg-rose-500 disabled:opacity-40"
                aria-label="Gửi"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                  <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

function fmtTime(ts) {
  if (!ts) return ''
  try { return new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }
  catch { return '' }
}
function fmtDateLong(ts) {
  if (!ts) return ''
  try {
    return new Date(ts).toLocaleDateString('vi-VN', {
      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
    })
  } catch { return '' }
}
function dayKey(ts) {
  if (!ts) return ''
  try { return new Date(ts).toISOString().slice(0, 10) } catch { return '' }
}

function TypingDots({ label }) {
  return (
    <div className="flex items-center gap-2 pl-1">
      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-3 py-2 shadow">
        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
      </span>
      {label ? <span className="truncate text-[10px] italic text-zinc-500">{label}…</span> : null}
    </div>
  )
}

function Ticks({ status }) {
  // sending = đang gửi (clock), sent = 1 tick xám, read = 2 tick xanh
  if (status === 'sending') {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white/70" fill="none" stroke="currentColor" strokeWidth={2}>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M12 7v5l3 2" />
      </svg>
    )
  }
  if (status === 'sent') {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white/80" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l5 5L20 7" />
      </svg>
    )
  }
  // read = double tick xanh dương
  return (
    <span className="inline-flex">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-sky-300" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 12l5 5L17 7" />
      </svg>
      <svg viewBox="0 0 24 24" className="-ml-2 h-3.5 w-3.5 text-sky-300" fill="none" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l5 5L22 7" />
      </svg>
    </span>
  )
}

function MessageBubble({ m, showAvatar, dateLabel }) {
  const role = m.senderRole
  const isTemp = typeof m.id === 'string' && m.id.startsWith('tmp-')
  const tickStatus = isTemp ? 'sending' : (m.readAt ? 'read' : 'sent')
  return (
    <>
      {dateLabel ? (
        <div className="my-3 flex items-center gap-3 text-[10px] text-zinc-500">
          <span className="h-px flex-1 bg-white/[0.06]" />
          <span className="uppercase tracking-wider">{dateLabel}</span>
          <span className="h-px flex-1 bg-white/[0.06]" />
        </div>
      ) : null}
      {role === 'SYSTEM' ? (
        <p className="text-center text-[11px] italic text-zinc-500">— {m.content} —</p>
      ) : (
        <div className={`flex ${role === 'USER' ? 'justify-end' : 'justify-start'} gap-2`}>
          {role === 'CARE' && showAvatar ? (
            <span className="grid h-7 w-7 shrink-0 place-items-center self-end rounded-full bg-gradient-to-br from-rose-500 to-pink-500 text-[11px] font-bold text-white">
              {(m.senderName || 'CS').slice(0, 1).toUpperCase()}
            </span>
          ) : role === 'CARE' ? <span className="w-7 shrink-0" /> : null}
          <div className={`max-w-[78%] ${role === 'USER' ? 'items-end' : 'items-start'} flex flex-col`}>
            {role === 'CARE' && showAvatar && m.senderName ? (
              <span className="mb-0.5 ml-2 text-[10px] font-semibold text-rose-300">{m.senderName}</span>
            ) : null}
            <div
              className={`rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                role === 'USER'
                  ? 'rounded-br-sm bg-gradient-to-br from-rose-500 to-pink-500 text-white'
                  : 'rounded-bl-sm bg-zinc-800 text-zinc-100'
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{m.content}</p>
            </div>
            <span className="mt-1 flex items-center gap-1 px-1 text-[10px] text-zinc-500">
              {fmtTime(m.createdAt)}
              {role === 'USER' ? <Ticks status={tickStatus} /> : null}
            </span>
          </div>
        </div>
      )}
    </>
  )
}
