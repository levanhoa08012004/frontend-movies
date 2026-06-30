import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../context/useAuth.js'
import * as supportApi from '../../services/supportChatApi'
import chatWS from '../../services/chatWebSocket'

/**
 * Dashboard CARE — Messenger-style layout 2 cột:
 *   - Cột trái: list conversation (tabs "Tất cả / Của tôi"), badge unread, search nhanh.
 *   - Cột phải: chat panel của conversation đang chọn, nút Nhận / Đóng.
 *
 * Realtime:
 *   - /topic/care.inbox: re-sort inbox khi có conv mới hoặc message mới.
 *   - /topic/conversation.{id}: append message vào panel khi đang mở.
 */
export default function CareSupportDashboard() {
  const { user } = useAuth()
  const [tab, setTab] = useState('all') // all | mine
  const [search, setSearch] = useState('')
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [userTyping, setUserTyping] = useState(false)
  const listSubRef = useRef(null)
  const convSubRef = useRef(null)
  const typingSubRef = useRef(null)
  const readSubRef = useRef(null)
  const typingEndRef = useRef(null)
  const lastTypingSentRef = useRef(0)
  const msgsRef = useRef(null)

  const reloadInbox = useCallback(async () => {
    setLoading(true)
    try {
      const page = await supportApi.careListInbox({ mineOnly: tab === 'mine', size: 60 })
      setList(page?.content || [])
    } catch {
      setList([])
    } finally {
      setLoading(false)
    }
  }, [tab])

  useEffect(() => { reloadInbox() }, [reloadInbox])

  // Subscribe /topic/care.inbox để re-sort khi có activity mới
  useEffect(() => {
    const id = chatWS.subscribe('/topic/care.inbox', (conv) => {
      if (!conv?.id) return
      setList((cur) => {
        const idx = cur.findIndex((c) => c.id === conv.id)
        if (idx === -1) return [conv, ...cur]
        const next = cur.slice()
        next[idx] = { ...next[idx], ...conv }
        // bring to top
        next.sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0))
        return next
      })
    })
    listSubRef.current = id
    return () => {
      if (listSubRef.current != null) chatWS.unsubscribe(listSubRef.current)
      listSubRef.current = null
    }
  }, [])

  // Khi chọn conversation → load messages + subscribe topic
  useEffect(() => {
    if (!selected?.id) {
      setMessages([])
      return
    }
    supportApi.careGetMessages(selected.id).then(setMessages).catch(() => setMessages([]))
    setList((cur) => cur.map((c) => (c.id === selected.id ? { ...c, unreadForCare: 0 } : c)))

    const cid = selected.id
    convSubRef.current = chatWS.subscribe(`/topic/conversation.${cid}`, (msg) => {
      if (!msg) return
      setMessages((cur) => {
        if (msg.id && cur.some((m) => m.id === msg.id)) return cur
        return [...cur, msg]
      })
      // USER vừa gửi message → tắt indicator "đang gõ" ngay (không đợi timeout)
      if (msg.senderRole === 'USER') {
        setUserTyping(false)
        if (typingEndRef.current) clearTimeout(typingEndRef.current)
      }
    })
    typingSubRef.current = chatWS.subscribe(`/topic/conversation.${cid}.typing`, (ev) => {
      if (!ev || ev.senderRole !== 'USER') return
      setUserTyping(true)
      if (typingEndRef.current) clearTimeout(typingEndRef.current)
      typingEndRef.current = setTimeout(() => setUserTyping(false), 1500)
    })
    readSubRef.current = chatWS.subscribe(`/topic/conversation.${cid}.read`, (ev) => {
      // eslint-disable-next-line no-console
      console.log('[care-dash] ◀ read receipt', ev)
      if (!ev || ev.by !== 'USER') return
      setMessages((cur) =>
        cur.map((m) =>
          m.senderRole === 'CARE' && !m.readAt ? { ...m, readAt: ev.at || new Date().toISOString() } : m,
        ),
      )
    })
    return () => {
      if (convSubRef.current != null) chatWS.unsubscribe(convSubRef.current)
      if (typingSubRef.current != null) chatWS.unsubscribe(typingSubRef.current)
      if (readSubRef.current != null) chatWS.unsubscribe(readSubRef.current)
      convSubRef.current = typingSubRef.current = readSubRef.current = null
      if (typingEndRef.current) clearTimeout(typingEndRef.current)
      setUserTyping(false)
    }
  }, [selected?.id])

  function emitTyping() {
    if (!selected?.id) return
    const now = Date.now()
    if (now - lastTypingSentRef.current < 1500) return
    lastTypingSentRef.current = now
    chatWS.publish('/app/support/typing', {
      conversationId: selected.id,
      senderRole: 'CARE',
      senderName: user?.name || 'CSKH',
    })
  }

  // Auto scroll khi có tin mới hoặc indicator typing xuất hiện
  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight
  }, [messages, userTyping])

  // Auto mark-read mỗi khi CARE đang xem conversation và có tin mới đến.
  // Trước đây chỉ mark khi switch conv → tin USER gửi vào conv đang mở không
  // được mark → USER không thấy 2 tick. Giờ deps gồm messages.length, mỗi tin
  // mới đều trigger mark.
  useEffect(() => {
    if (!selected?.id) return
    // eslint-disable-next-line no-console
    console.log('[care-dash] ► mark read conv', selected.id, 'msgs=', messages.length)
    supportApi.careMarkRead(selected.id).catch((e) => {
      // eslint-disable-next-line no-console
      console.warn('[care-dash] mark read failed', e?.response?.status, e?.message)
    })
  }, [selected?.id, messages.length])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (c) =>
        (c.userName || '').toLowerCase().includes(q) ||
        (c.userEmail || '').toLowerCase().includes(q) ||
        (c.lastMessagePreview || '').toLowerCase().includes(q),
    )
  }, [list, search])

  async function doSend() {
    const content = draft.trim()
    if (!content || !selected || sending) return
    setSending(true)
    setDraft('')
    const optimistic = {
      id: `tmp-${Date.now()}`,
      conversationId: selected.id,
      senderRole: 'CARE',
      senderName: user?.name || 'CSKH',
      content,
      createdAt: new Date().toISOString(),
    }
    setMessages((cur) => [...cur, optimistic])
    try {
      const saved = await supportApi.careSendMessage(selected.id, content)
      setMessages((cur) => cur.map((m) => (m.id === optimistic.id ? saved : m)))
    } catch {
      setMessages((cur) => cur.filter((m) => m.id !== optimistic.id))
      setDraft(content)
    } finally {
      setSending(false)
    }
  }

  async function doAssign() {
    if (!selected) return
    const updated = await supportApi.careAssign(selected.id)
    setSelected(updated)
    setList((cur) => cur.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)))
  }

  async function doClose() {
    if (!selected) return
    if (!confirm('Đóng cuộc trò chuyện này?')) return
    const updated = await supportApi.careClose(selected.id)
    setSelected(updated)
    // Refresh list (closed convs ra khỏi inbox OPEN)
    reloadInbox()
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] bg-zinc-950 text-zinc-100">
      {/* Sidebar conversations */}
      <aside className="flex w-full max-w-sm flex-col border-r border-white/[0.06] bg-zinc-900/40">
        <header className="border-b border-white/[0.06] px-4 py-3">
          <h2 className="font-display text-lg font-bold text-white">Hỗ trợ khách hàng</h2>
          <p className="mt-0.5 text-xs text-zinc-500">Hộp thư trực tuyến — realtime</p>
        </header>
        <div className="flex gap-1 border-b border-white/[0.06] bg-zinc-900/30 px-3 py-2">
          <TabBtn active={tab === 'all'} onClick={() => setTab('all')}>Tất cả</TabBtn>
          <TabBtn active={tab === 'mine'} onClick={() => setTab('mine')}>Của tôi</TabBtn>
        </div>
        <div className="border-b border-white/[0.06] p-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên / email / nội dung…"
            className="w-full rounded-full border border-white/10 bg-zinc-900 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-brand-coral/40 focus:outline-none"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="px-4 py-6 text-sm text-zinc-500">Đang tải…</p>
          ) : filtered.length === 0 ? (
            <p className="px-4 py-6 text-sm text-zinc-500">
              {tab === 'mine' ? 'Bạn chưa nhận hội thoại nào.' : 'Inbox trống.'}
            </p>
          ) : (
            filtered.map((c) => (
              <ConversationRow
                key={c.id}
                conv={c}
                active={selected?.id === c.id}
                onClick={() => setSelected(c)}
              />
            ))
          )}
        </div>
      </aside>

      {/* Chat panel */}
      <main className="flex min-w-0 flex-1 flex-col">
        {!selected ? (
          <div className="m-auto max-w-md text-center text-zinc-500">
            <p className="text-2xl">💬</p>
            <p className="mt-2 text-sm">Chọn một cuộc trò chuyện ở cột trái để bắt đầu hỗ trợ.</p>
          </div>
        ) : (
          <>
            <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] bg-zinc-900/30 px-5 py-3">
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-white">{selected.userName || 'Người dùng'}</p>
                <p className="truncate text-xs text-zinc-500">
                  {selected.userEmail || `User #${selected.userId}`}
                  {selected.assigneeName ? ` · Đang xử lý: ${selected.assigneeName}` : ' · Chưa được nhận'}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                {!selected.assigneeId && (
                  <button
                    onClick={doAssign}
                    className="rounded-lg bg-brand-coral px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-500"
                  >
                    Nhận hội thoại
                  </button>
                )}
                {selected.status === 'OPEN' && (
                  <button
                    onClick={doClose}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:border-red-500/40 hover:text-red-300"
                  >
                    Đóng
                  </button>
                )}
              </div>
            </header>

            <div ref={msgsRef} className="flex-1 space-y-2 overflow-y-auto bg-zinc-900/40 px-5 py-4">
              {messages.length === 0 ? (
                <p className="mt-10 text-center text-xs text-zinc-500">Chưa có tin nhắn nào.</p>
              ) : (
                messages.map((m, idx) => (
                  <CareBubble
                    key={m.id}
                    m={m}
                    prev={idx > 0 ? messages[idx - 1] : null}
                    userName={selected?.userName}
                  />
                ))
              )}
              {userTyping ? <CareTypingDots label={`${selected.userName || 'Khách'} đang gõ`} /> : null}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                doSend()
              }}
              className="flex items-center gap-2 border-t border-white/[0.06] bg-zinc-950 px-5 py-3"
            >
              <input
                value={draft}
                onChange={(e) => { setDraft(e.target.value); if (e.target.value) emitTyping() }}
                placeholder="Nhập tin nhắn trả lời…"
                maxLength={4000}
                disabled={selected.status === 'CLOSED'}
                className="min-w-0 flex-1 rounded-full border border-white/10 bg-zinc-900 px-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-brand-coral/40 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!draft.trim() || sending || selected.status === 'CLOSED'}
                className="rounded-full bg-brand-coral px-5 py-2 text-sm font-bold text-white hover:bg-rose-500 disabled:opacity-40"
              >
                Gửi
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  )
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
        active ? 'bg-brand-coral text-white' : 'text-zinc-300 hover:bg-white/5'
      }`}
    >
      {children}
    </button>
  )
}

function ConversationRow({ conv, active, onClick }) {
  const time = conv.lastMessageAt ? new Date(conv.lastMessageAt) : null
  const unread = conv.unreadForCare ?? 0
  return (
    <button
      onClick={onClick}
      className={`flex w-full gap-3 border-b border-white/[0.04] px-4 py-3 text-left transition ${
        active ? 'bg-brand-coral/15' : 'hover:bg-white/[0.03]'
      }`}
    >
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-coral to-amber-400 font-bold text-white">
        {(conv.userName || conv.userEmail || '?').slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-white">{conv.userName || 'Người dùng'}</p>
          {time ? (
            <span className="shrink-0 text-[10px] text-zinc-500">
              {time.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          ) : null}
        </div>
        <p className="truncate text-xs text-zinc-400">{conv.lastMessagePreview || 'Chưa có tin nhắn'}</p>
        <div className="mt-1 flex items-center gap-1.5">
          {!conv.assigneeId ? (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] text-amber-300">Mới</span>
          ) : (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-300">
              {conv.assigneeName}
            </span>
          )}
          {unread > 0 && (
            <span className="rounded-full bg-brand-coral px-2 py-0.5 text-[10px] font-bold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
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

function CareTypingDots({ label }) {
  return (
    <div className="flex items-center gap-2 pl-2">
      <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 px-3 py-2 shadow">
        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
      </span>
      {label ? <span className="truncate text-[11px] italic text-zinc-500">{label}…</span> : null}
    </div>
  )
}

function Ticks({ status }) {
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

function CareBubble({ m, prev, userName }) {
  const role = m.senderRole
  const newDay = !prev || dayKey(prev.createdAt) !== dayKey(m.createdAt)
  const showHead = !prev || prev.senderRole !== m.senderRole
  const isTemp = typeof m.id === 'string' && m.id.startsWith('tmp-')
  const tickStatus = isTemp ? 'sending' : (m.readAt ? 'read' : 'sent')
  return (
    <>
      {newDay ? (
        <div className="my-3 flex items-center gap-3 text-[10px] text-zinc-500">
          <span className="h-px flex-1 bg-white/[0.06]" />
          <span className="uppercase tracking-wider">{fmtDateLong(m.createdAt)}</span>
          <span className="h-px flex-1 bg-white/[0.06]" />
        </div>
      ) : null}
      {role === 'SYSTEM' ? (
        <p className="text-center text-[11px] italic text-zinc-500">— {m.content} —</p>
      ) : (
        <div className={`flex gap-2 ${role === 'CARE' ? 'justify-end' : 'justify-start'}`}>
          {role === 'USER' && showHead ? (
            <span className="grid h-8 w-8 shrink-0 place-items-center self-end rounded-full bg-gradient-to-br from-brand-coral to-amber-400 text-xs font-bold text-white">
              {(userName || 'U').slice(0, 1).toUpperCase()}
            </span>
          ) : role === 'USER' ? <span className="w-8 shrink-0" /> : null}
          <div className={`max-w-[70%] ${role === 'CARE' ? 'items-end' : 'items-start'} flex flex-col`}>
            {showHead && role === 'USER' ? (
              <span className="mb-0.5 ml-2 text-[10px] font-semibold text-zinc-400">
                {userName || 'Khách hàng'}
              </span>
            ) : null}
            {showHead && role === 'CARE' && m.senderName ? (
              <span className="mb-0.5 mr-2 text-[10px] font-semibold text-rose-300">{m.senderName}</span>
            ) : null}
            <div
              className={`rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-sm ${
                role === 'CARE'
                  ? 'rounded-br-sm bg-gradient-to-br from-rose-500 to-pink-500 text-white'
                  : 'rounded-bl-sm bg-zinc-800 text-zinc-100'
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{m.content}</p>
            </div>
            <span className="mt-1 flex items-center gap-1 px-1 text-[10px] text-zinc-500">
              {fmtTime(m.createdAt)}
              {role === 'CARE' ? <Ticks status={tickStatus} /> : null}
            </span>
          </div>
        </div>
      )}
    </>
  )
}
