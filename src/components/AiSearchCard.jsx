import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import MovieCard from './MovieCard.jsx'
import { useAuth } from '../context/useAuth.js'
import * as recommendationApi from '../services/recommendationApi'

const CACHE_KEY_PREFIX = 'aiSearch:cache:'
const LEGACY_KEY = 'aiSearch:cache' // pre-fix key, drop khi gặp
const cacheKey = (userId) => `${CACHE_KEY_PREFIX}${userId || 'anon'}`

function readCache(userId) {
  if (typeof window === 'undefined') return null
  try {
    // Migration: xoá key cũ không kèm userId — cache lệch user
    window.sessionStorage.removeItem(LEGACY_KEY)
    const raw = window.sessionStorage.getItem(cacheKey(userId))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeCache(snapshot, userId) {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(cacheKey(userId), JSON.stringify(snapshot))
  } catch {
    /* ignore quota/serialization errors — cache is best-effort */
  }
}

/** Xoá toàn bộ aiSearch cache cross-user — gọi từ AuthContext khi login/logout. */
export function invalidateAiSearchCache() {
  if (typeof window === 'undefined') return
  try {
    const ss = window.sessionStorage
    window.sessionStorage.removeItem(LEGACY_KEY)
    const toRemove = []
    for (let i = 0; i < ss.length; i++) {
      const k = ss.key(i)
      if (k && k.startsWith(CACHE_KEY_PREFIX)) toRemove.push(k)
    }
    toRemove.forEach((k) => ss.removeItem(k))
  } catch { /* ignore */ }
}

const QUICK_PROMPTS = [
  'Giống Inception nhưng dễ hiểu hơn',
  'Hài lãng mạn cho cuối tuần',
  'Phim Hàn gây nghiện như Squid Game',
  'Sci-fi triết học, nhịp chậm',
  'Phim trinh thám cân não dưới 2 tiếng',
]

function ResultCard({ movie }) {
  const hasId = movie?.id !== null && movie?.id !== undefined
  // Recommendation click → carry mọi identifier có sẵn (slug/tmdb/kind) để Spring
  // waterfall: source_slug → catalog_id → tmdb_id+kind. MovieDetail rewrite URL
  // về PK sau khi resolve, mọi call con (rate/comment) tự nhiên dùng PK.
  let target = '/explore'
  if (hasId) {
    const params = new URLSearchParams({ via: 'catalog' })
    if (movie.sourceSlug) params.set('slug', movie.sourceSlug)
    if (movie.tmdbId) params.set('tmdb', String(movie.tmdbId))
    if (movie.mediaKind) params.set('kind', movie.mediaKind)
    target = `/movies/${movie.id}?${params.toString()}`
  }
  return (
    <div className="flex flex-col">
      <Link to={target} className="block">
        {/* to={null} → MovieCard render div, không tạo nested <a>. URL via=catalog
            ở outer Link giữ nguyên để Spring waterfall resolve qua slug/tmdb. */}
        <MovieCard movie={movie} widthClass="w-full" to={null} />
      </Link>
      <p className="mt-2 line-clamp-2 text-sm font-semibold text-white">{movie.title}</p>
      {movie.reason ? (
        <p className="mt-1 line-clamp-3 text-[12px] leading-relaxed text-zinc-400">
          <span className="text-brand-coral">▸</span> {movie.reason}
        </p>
      ) : null}
    </div>
  )
}

function ResultsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="aspect-[2/3] w-full animate-pulse rounded-xl bg-zinc-800/80" />
          <div className="h-3 w-3/4 animate-pulse rounded bg-zinc-800/60" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-800/40" />
        </div>
      ))}
    </div>
  )
}

export default function AiSearchCard() {
  const { user, isGuest } = useAuth()
  const inputRef = useRef(null)
  const resultsRef = useRef(null)

  // Guest mode — không gọi API gợi ý (yêu cầu auth + lịch sử cá nhân hoá),
  // hiển thị prompt mời đăng nhập với ảnh nền card giữ nguyên Netflix style.
  if (isGuest) {
    return (
      <section className="mt-10 sm:mt-12">
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent p-6 ring-1 ring-white/[0.04] sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-coral/35 bg-brand-coral/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-coral">
              ✨ Trợ lý AI
            </span>
            <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
              Gợi ý phim cá nhân hoá bằng AI
            </h2>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Đăng nhập để gõ câu mô tả tự nhiên (vd. "phim sci-fi nhẹ nhàng giống Inception")
            và nhận 12 gợi ý được học theo gu xem phim của riêng bạn. Khách (Guest)
            vẫn có thể duyệt catalog phim trong mục <a href="/explore" className="text-brand-coral hover:underline">Phim</a>.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-coral px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-coral/25 transition hover:bg-rose-500"
            >
              Đăng nhập
            </a>
            <a
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-zinc-200 transition hover:border-brand-coral/40 hover:text-white"
            >
              Tạo tài khoản
            </a>
          </div>
        </div>
      </section>
    )
  }

  // Cache scope theo user.id — đăng nhập user khác sẽ đọc key khác, không leak
  // dữ liệu của user trước. Lazy init đọc 1 lần ở mount; useEffect dưới đảm bảo
  // khi user.id đổi (login khác tài khoản trong cùng phiên) state reset đúng.
  const userId = user?.id ? String(user.id) : 'anon'
  const [query, setQuery] = useState(() => readCache(userId)?.query ?? '')

  const [result, setResult] = useState(() => readCache(userId)?.result ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Khi đổi user (login/logout/đổi tài khoản) → re-hydrate từ cache key mới.
  // Nếu cache rỗng cho user này → clear state thay vì giữ data user cũ.
  const lastUserIdRef = useRef(userId)
  useEffect(() => {
    if (lastUserIdRef.current === userId) return
    lastUserIdRef.current = userId
    const snap = readCache(userId)
    setQuery(snap?.query ?? '')
    setResult(snap?.result ?? null)
    setError('')
  }, [userId])

  useEffect(() => {
    writeCache({ query, result }, userId)
  }, [query, result, userId])

  const submitSearch = useCallback(
    async ({ q }) => {
      const text = (q ?? query).trim()
      if (!text) {
        setError('Hãy mô tả phim bạn muốn xem.')
        inputRef.current?.focus()
        return
      }
      setError('')
      setLoading(true)

      try {
        const payload = {
          query: text,
          top_k: 12,
          user_id: user?.id ? String(user.id) : undefined,
        }
        const data = await recommendationApi.conversationalSearch(payload)
        setResult(data)
        window.requestAnimationFrame(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      } catch (e) {
        setError(e.response?.data?.message || e.message || 'Không tải được gợi ý.')
      } finally {
        setLoading(false)
      }
    },
    [query, user],
  )

  const onSubmit = (e) => {
    e.preventDefault()
    submitSearch({ q: query })
  }

  const handleQuickPrompt = (text) => {
    setQuery(text)
    submitSearch({ q: text })
  }

  return (
    <section className="mt-10 sm:mt-12">
      {/* Card compact */}
      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] via-white/[0.02] to-transparent p-5 ring-1 ring-white/[0.04] sm:p-7">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-coral/35 bg-brand-coral/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-coral">
            ✨ Trợ lý AI
          </span>
          <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
            Bạn muốn xem gì tối nay?
          </h2>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Gõ tự nhiên — "phim sci-fi nhẹ nhàng giống Inception", "hài lãng mạn Hàn".
          AI chọn 12 phim từ kho và giải thích lý do.
        </p>

        <form onSubmit={onSubmit} className="mt-5">
          <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/30 p-2 focus-within:border-brand-coral/40 sm:flex-row sm:items-center sm:pl-4">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="vd. phim sci-fi nhẹ nhàng, không quá dark…"
              className="min-w-0 flex-1 bg-transparent py-2.5 text-[15px] text-white placeholder:text-zinc-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center rounded-lg bg-brand-coral px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-coral/20 transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Đang tìm…' : 'Tìm phim'}
            </button>
          </div>
        </form>

        {!result && !loading ? (
          <div className="mt-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Gợi ý nhanh</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleQuickPrompt(p)}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs text-zinc-300 transition hover:border-brand-coral/40 hover:bg-brand-coral/10 hover:text-white"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}
      </div>

      {/* Kết quả tách ra ngoài card */}
      {(loading || result) && (
        <section ref={resultsRef} className="mt-8">
          {loading ? (
            <>
              <div className="h-5 w-2/3 max-w-xl animate-pulse rounded bg-zinc-800/60" />
              <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-zinc-800/40" />
              <div className="mt-6">
                <ResultsSkeleton />
              </div>
            </>
          ) : result ? (
            <>
              {result.reasoning ? (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-coral/80">
                    AI nói gì về gu của bạn
                  </p>
                  <p className="mt-2 text-[15px] leading-relaxed text-zinc-200">{result.reasoning}</p>
                </div>
              ) : null}

              {result.recommendations?.length ? (
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {result.recommendations.map((m, idx) => (
                    <ResultCard key={`${m.title}-${idx}`} movie={m} />
                  ))}
                </div>
              ) : (
                <p className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-zinc-400">
                  Không tìm thấy phim phù hợp. Hãy thử mô tả khác.
                </p>
              )}
            </>
          ) : null}
        </section>
      )}
    </section>
  )
}
