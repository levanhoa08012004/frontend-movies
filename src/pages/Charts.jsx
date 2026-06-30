import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MovieCard from '../components/MovieCard.jsx'
import * as movieApi from '../services/movieApi'

const TABS = [
  { id: 'day', label: 'Theo ngày', fn: () => movieApi.topDay({ size: 20, page: 0 }) },
  { id: 'week', label: 'Theo tuần', fn: () => movieApi.topWeek({ size: 20, page: 0 }) },
  { id: 'month', label: 'Theo tháng', fn: () => movieApi.topMonth({ size: 20, page: 0 }) },
]

export default function Charts() {
  const [tab, setTab] = useState('day')
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  const load = useCallback(async (tid) => {
    const t = TABS.find((x) => x.id === tid)
    if (!t) return
    setLoading(true)
    setErr('')
    try {
      const data = await t.fn()
      setList(data.content || [])
    } catch (e) {
      setErr(e.response?.data?.message || e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    document.title = 'BXH — VieStream'
  }, [])

  useEffect(() => {
    load(tab).catch(() => {})
  }, [tab, load])

  /** Quay lại tab / cửa sổ có focus → làm mới BXH (số liệu lượt xem đã cập nhật trên máy chủ). */
  useEffect(() => {
    const bump = () => {
      if (document.visibilityState === 'visible') {
        load(tab).catch(() => {})
      }
    }
    window.addEventListener('focus', bump)
    document.addEventListener('visibilitychange', bump)
    return () => {
      window.removeEventListener('focus', bump)
      document.removeEventListener('visibilitychange', bump)
    }
  }, [tab, load])

  return (
    <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:pb-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_70%_50%_at_50%_-20%,rgba(244,63,94,0.1),transparent)]" />
      <div className="relative">
        <h1 className="font-display text-4xl font-bold tracking-tight text-white md:text-5xl">Bảng xếp hạng lượt xem</h1>

        <div className="mt-8 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                tab === t.id
                  ? 'bg-brand-coral text-white shadow-lg shadow-brand-coral/25'
                  : 'border border-white/12 bg-white/[0.04] text-zinc-300 hover:border-brand-coral/35'
              }`}
            >
              {t.label}
            </button>
          ))}
          <button
            type="button"
            className="rounded-xl border border-dashed border-zinc-600 px-4 py-2.5 text-sm text-zinc-500 hover:border-brand-coral/40 hover:text-zinc-300"
            onClick={() => load(tab)}
          >
            Làm mới ngay
          </button>
        </div>
        {err ? <p className="relative mt-6 rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-red-200">{err}</p> : null}
        {loading ? (
          <div className="relative mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-5">
            {[1, 2, 3, 4, 5, 6].map((k) => (
              <div key={k} className="animate-pulse">
                <div className="aspect-[2/3] rounded-2xl bg-zinc-800" />
              </div>
            ))}
          </div>
        ) : (
          <div className="relative mt-10 flex flex-wrap gap-6">
            {list.map((m, idx) => (
              <div key={`${tab}-${m.id}`} className="relative">
                <span className="absolute -left-1 -top-2 z-10 flex size-7 items-center justify-center rounded-full border border-brand-coral/35 bg-brand-coral/90 text-xs font-black text-black">
                  {idx + 1}
                </span>
                <MovieCard movie={m} />
              </div>
            ))}
          </div>
        )}
        <p className="relative mt-16 text-center text-sm text-zinc-600">
          Muốn lọc theo thể loại hoặc năm?{' '}
          <Link to="/explore" className="font-medium text-brand-coral hover:underline">
            Khám phá
          </Link>
        </p>
      </div>
    </div>
  )
}
