import { Link } from 'react-router-dom'

/**
 * Layout chung trang quản trị — rộng, chữ lớn.
 */
export default function AdminPageShell({
  eyebrow = 'Quản trị VieStream',
  title,
  subtitle,
  backTo,
  backLabel = '← Bảng quản trị',
  actions = null,
  children,
}) {
  return (
    <div className="mx-auto w-full max-w-[1680px] px-5 py-10 sm:px-8 lg:px-12 xl:px-14">
      {backTo ? (
        <Link
          to={backTo}
          className="mb-10 inline-flex text-base font-semibold text-brand-coral transition hover:text-rose-300"
        >
          {backLabel}
        </Link>
      ) : null}

      <header className="border-b border-white/10 pb-12">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-amber-500/90">{eyebrow}</p>
        <div className="mt-6 flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <h1 className="font-display text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-[3rem]">{title}</h1>
            {subtitle ? <p className="mt-4 max-w-3xl text-base leading-relaxed text-zinc-400 md:text-lg">{subtitle}</p> : null}
          </div>
          {actions}
        </div>
      </header>

      <div className="pt-4">{children}</div>
    </div>
  )
}
