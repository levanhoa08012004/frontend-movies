import { Link } from 'react-router-dom'
import MovieCard from './MovieCard.jsx'

/**
 * Netflix-style horizontal row scrollable. Đầu vào: title + movies array + viewAllTo.
 * Skeleton khi loading. Tự ẩn nếu movies rỗng (giữ Home gọn).
 */
export default function MovieRow({ title, eyebrow, movies, loading, viewAllTo, accent = 'coral' }) {
  if (!loading && (!movies || !movies.length)) return null

  const accentClass = accent === 'gold' ? 'text-brand-gold' : 'text-brand-coral'

  return (
    <section className="mt-12">
      <div className="mb-4 flex items-end justify-between gap-3 px-1">
        <div className="min-w-0">
          {eyebrow ? (
            <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${accentClass}/80`}>{eyebrow}</p>
          ) : null}
          <h2 className="font-display mt-1 truncate text-xl font-bold text-white sm:text-2xl">{title}</h2>
        </div>
        {viewAllTo ? (
          <Link
            to={viewAllTo}
            className={`shrink-0 text-xs font-semibold ${accentClass} hover:underline`}
          >
            Xem tất cả →
          </Link>
        ) : null}
      </div>

      <div className="vie-scrollbar-hide relative -mx-3 overflow-x-auto px-3 sm:-mx-6 sm:px-6">
        <div className="flex gap-3 pb-2 sm:gap-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="w-32 shrink-0 sm:w-40 lg:w-44">
                  <div className="aspect-[2/3] w-full animate-pulse rounded-lg bg-zinc-800/80" />
                  <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-zinc-800/60" />
                </div>
              ))
            : movies.map((m) => (
                <Link
                  key={m.id}
                  to={`/movies/${m.id}`}
                  className="w-32 shrink-0 sm:w-40 lg:w-44 transition-transform hover:scale-[1.04]"
                >
                  <MovieCard movie={m} widthClass="w-full" showTitleBelow />
                </Link>
              ))}
        </div>
      </div>
    </section>
  )
}
