import { useRef } from 'react'
import { Link } from 'react-router-dom'

export default function PosterRail({
  title,
  tag,
  subtitle,
  toAll = '/explore',
  loading,
  skeletonCount = 12,
  children,
  cardWidth = 'w-[152px]',
}) {
  const scroller = useRef(null)
  const scrollBy = (dir) => {
    const el = scroller.current
    if (!el) return
    const step = Math.min(el.clientWidth * 0.85, 520)
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }

  return (
    <section className="mt-12 sm:mt-16">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3 px-1">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {tag ? (
              <span className="rounded border border-brand-coral/35 bg-brand-coral/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-coral">
                {tag}
              </span>
            ) : null}
            <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white sm:text-xl md:text-2xl">
              {title}
            </h2>
          </div>
          {subtitle ? <p className="mt-1.5 text-sm text-zinc-500">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Cuộn trái"
            onClick={() => scrollBy(-1)}
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-200 transition hover:border-brand-coral/40 hover:bg-brand-coral/10 sm:flex"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Cuộn phải"
            onClick={() => scrollBy(1)}
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-200 transition hover:border-brand-coral/40 hover:bg-brand-coral/10 sm:flex"
          >
            ›
          </button>
          <Link
            to={toAll}
            className="rounded-full border border-white/12 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:border-brand-coral/35 hover:text-white"
          >
            Xem tất cả
          </Link>
        </div>
      </div>
      <div
        ref={scroller}
        className="vie-scrollbar-hide flex gap-3 overflow-x-auto pb-2 pt-1 sm:gap-4"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {loading
          ? [...Array(skeletonCount)].map((_, i) => (
              <div
                key={`sk-${i}`}
                className={`${cardWidth} flex-shrink-0 animate-pulse rounded-xl bg-zinc-800/80 md:rounded-2xl`}
                style={{ aspectRatio: '2/3', scrollSnapAlign: 'start' }}
              />
            ))
          : children}
      </div>
    </section>
  )
}
