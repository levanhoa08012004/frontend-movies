import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import MovieCard from '../components/MovieCard.jsx'
import * as recommendationApi from '../services/recommendationApi'
import * as movieApi from '../services/movieApi'
import { useAuth } from '../context/useAuth.js'

const QUICK_PROMPTS = [
  'Giống Inception nhưng dễ hiểu hơn',
  'Hài lãng mạn cho cuối tuần',
  'Phim Hàn gây nghiện như Squid Game',
  'Sci-fi triết học, nhịp chậm',
  'Phim trinh thám cân não dưới 2 tiếng',
]

const MOOD_OPTIONS = [
  { value: '', label: 'Tâm trạng' },
  { value: 'uplifting', label: 'Nhẹ nhàng' },
  { value: 'relaxed', label: 'Thư giãn' },
  { value: 'intense', label: 'Căng thẳng' },
  { value: 'thoughtful', label: 'Suy ngẫm' },
  { value: 'fun', label: 'Giải trí' },
]

const ERA_OPTIONS = [
  { value: '', label: 'Thời đại' },
  { value: 'classic', label: 'Kinh điển (< 1990)' },
  { value: 'modern', label: '1990 — 2010' },
  { value: 'recent', label: 'Mới (> 2010)' },
]

const LANG_OPTIONS = [
  { value: '', label: 'Quốc gia' },
  { value: 'ko', label: 'Hàn Quốc' },
  { value: 'ja', label: 'Nhật Bản' },
  { value: 'zh', label: 'Trung Quốc' },
  { value: 'en', label: 'Âu Mỹ' },
  { value: 'vi', label: 'Việt Nam' },
]

function buildFiltersPayload({ mood, era, lang }) {
  const filters = {}
  if (mood) filters.mood = mood
  if (era) filters.era = era
  if (lang) filters.prefer_languages = [lang]
  return Object.keys(filters).length ? filters : null
}

function ResultCard({ movie }) {
  const hasId = movie?.id !== null && movie?.id !== undefined
  const target = hasId ? `/movies/${movie.id}` : '/explore'
  return (
    <div className="flex flex-col">
      <Link to={target} className="block">
        <MovieCard movie={movie} widthClass="w-full" />
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

export default function Home() {
  const { user } = useAuth()
  const inputRef = useRef(null)
  const resultsRef = useRef(null)

  const [query, setQuery] = useState('')
  const [mood, setMood] = useState('')
  const [era, setEra] = useState('')
  const [lang, setLang] = useState('')

  const [result, setResult] = useState(null) // { reasoning, recommendations, suggested_refinements, query }
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [refineDraft, setRefineDraft] = useState('')
  const [refining, setRefining] = useState(false)

  const [trending, setTrending] = useState([])
  const [trendingLoading, setTrendingLoading] = useState(true)

  const welcomeName = user?.name?.trim() || user?.username || 'bạn'

  useEffect(() => {
    document.title = 'Tìm phim bằng hội thoại — VieStream'
    movieApi
      .trending({ size: 12, page: 0 })
      .then((r) => setTrending(r.content || []))
      .catch(() => setTrending([]))
      .finally(() => setTrendingLoading(false))
  }, [])

  const submitSearch = useCallback(
    async ({ q, refinement }) => {
      const text = (q ?? query).trim()
      if (!text) {
        setError('Hãy mô tả phim bạn muốn xem.')
        inputRef.current?.focus()
        return
      }
      setError('')
      if (refinement) setRefining(true)
      else setLoading(true)

      try {
        const payload = {
          query: text,
          top_k: 12,
          user_id: user?.id ? String(user.id) : undefined,
          filters: buildFiltersPayload({ mood, era, lang }),
        }
        if (refinement) {
          payload.refinement = refinement
          payload.history = [
            { role: 'user', content: result?.query || text },
            { role: 'assistant', content: result?.reasoning || '' },
          ]
        }
        const data = await recommendationApi.conversationalSearch(payload)
        setResult(data)
        setRefineDraft('')
        // Cuộn xuống vùng kết quả nếu là search mới
        if (!refinement) {
          window.requestAnimationFrame(() => {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          })
        }
      } catch (e) {
        setError(e.response?.data?.message || e.message || 'Không tải được gợi ý.')
      } finally {
        setLoading(false)
        setRefining(false)
      }
    },
    [query, mood, era, lang, user, result?.query, result?.reasoning],
  )

  const onSubmit = (e) => {
    e.preventDefault()
    submitSearch({ q: query })
  }

  const onRefineSubmit = (e) => {
    e.preventDefault()
    if (!refineDraft.trim()) return
    submitSearch({ refinement: refineDraft.trim() })
  }

  const handleQuickPrompt = (text) => {
    setQuery(text)
    submitSearch({ q: text })
  }

  const handleSuggestion = (text) => {
    submitSearch({ refinement: text })
  }

  return (
    <div className="relative pb-28">
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[620px] bg-[radial-gradient(ellipse_100%_80%_at_50%_-20%,rgba(225,29,72,0.14),transparent_55%),radial-gradient(ellipse_80%_60%_at_100%_0%,rgba(244,63,94,0.06),transparent)]" />
      <div className="pointer-events-none fixed inset-0 -z-20 bg-brand-ink" />

      <div className="mx-auto max-w-[1400px] px-3 sm:px-6 lg:px-10">
        {/* Hero search */}
        <section className="pt-12 sm:pt-16">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-coral/90">
            VieStream · Chào {welcomeName}
          </p>
          <h1 className="font-display mt-3 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            Bạn muốn xem gì tối nay?
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-zinc-400 sm:text-base">
            Gõ tự nhiên — "phim sci-fi nhẹ nhàng giống Inception", "hài lãng mạn Hàn",
            "trinh thám dưới 2 tiếng". AI sẽ chọn 12 phim từ kho và giải thích lý do.
          </p>

          <form onSubmit={onSubmit} className="mt-7">
            <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 ring-1 ring-white/[0.04] focus-within:border-brand-coral/40 focus-within:ring-brand-coral/20 sm:flex-row sm:items-center sm:p-2 sm:pl-5">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="vd. phim sci-fi nhẹ nhàng, không quá dark..."
                className="min-w-0 flex-1 bg-transparent py-3 text-base text-white placeholder:text-zinc-500 focus:outline-none sm:text-[15px]"
                autoFocus
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-xl bg-brand-coral px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-coral/20 transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Đang tìm…' : 'Tìm phim'}
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-200 focus:border-brand-coral/40 focus:outline-none"
              >
                {MOOD_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-zinc-900">
                    {o.label}
                  </option>
                ))}
              </select>
              <select
                value={era}
                onChange={(e) => setEra(e.target.value)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-200 focus:border-brand-coral/40 focus:outline-none"
              >
                {ERA_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-zinc-900">
                    {o.label}
                  </option>
                ))}
              </select>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-zinc-200 focus:border-brand-coral/40 focus:outline-none"
              >
                {LANG_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-zinc-900">
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </form>

          {!result && !loading ? (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Gợi ý nhanh</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleQuickPrompt(p)}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-zinc-300 transition hover:border-brand-coral/40 hover:bg-brand-coral/10 hover:text-white sm:text-sm"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="mt-5 rounded-xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          ) : null}
        </section>

        {/* Kết quả */}
        {(loading || result) && (
          <section ref={resultsRef} className="mt-12">
            {loading ? (
              <>
                <div className="h-5 w-2/3 max-w-xl animate-pulse rounded bg-zinc-800/60" />
                <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-zinc-800/40" />
                <div className="mt-8">
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
                  <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                    {result.recommendations.map((m, idx) => (
                      <ResultCard key={`${m.title}-${idx}`} movie={m} />
                    ))}
                  </div>
                ) : (
                  <p className="mt-7 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-zinc-400">
                    Không tìm thấy phim phù hợp. Hãy thử mô tả khác.
                  </p>
                )}

                {/* Refinement */}
                <div className="mt-10 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Tinh chỉnh kết quả
                  </p>
                  <form onSubmit={onRefineSubmit} className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      value={refineDraft}
                      onChange={(e) => setRefineDraft(e.target.value)}
                      placeholder='vd. "bỏ phim quá dài", "thêm phim Hàn"'
                      className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:border-brand-coral/40 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={refining || !refineDraft.trim()}
                      className="inline-flex items-center justify-center rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {refining ? 'Đang cập nhật…' : 'Áp dụng'}
                    </button>
                  </form>

                  {result.suggested_refinements?.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {result.suggested_refinements.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => handleSuggestion(s)}
                          disabled={refining}
                          className="rounded-full border border-brand-coral/30 bg-brand-coral/10 px-3.5 py-1.5 text-xs text-brand-coral transition hover:bg-brand-coral/20 disabled:opacity-50"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </>
            ) : null}
          </section>
        )}

        {/* Trending phía dưới khi chưa search */}
        {!result && !loading ? (
          <section className="mt-16">
            <div className="mb-5 flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Trong khi bạn nghĩ</p>
                <h2 className="font-display mt-1 text-xl font-bold text-white sm:text-2xl">Đang thịnh hành</h2>
              </div>
              <Link to="/explore" className="text-xs font-semibold text-brand-coral hover:underline">
                Xem tất cả
              </Link>
            </div>
            {trendingLoading ? (
              <ResultsSkeleton />
            ) : trending.length ? (
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
                {trending.slice(0, 12).map((m) => (
                  <Link key={m.id} to={`/movies/${m.id}`}>
                    <MovieCard movie={m} widthClass="w-full" showTitleBelow />
                  </Link>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  )
}
