import { Link } from 'react-router-dom'

const SUPPORT_EMAIL = 'support@movieplus.vn'
const LEGAL_EMAIL = 'legal@movieplus.vn'

const SOCIAL = [
  {
    name: 'Facebook',
    href: 'https://facebook.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-5">
        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.892h-2.33v6.987C18.343 21.128 22 16.991 22 12z" />
      </svg>
    ),
  },
  {
    name: 'YouTube',
    href: 'https://youtube.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-5">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    name: 'Instagram',
    href: 'https://instagram.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-5">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.336 3.608 1.311.975.975 1.249 2.242 1.311 3.608.058 1.266.069 1.646.069 4.85s-.012 3.584-.069 4.85c-.062 1.366-.336 2.633-1.311 3.608-.975.975-2.242 1.249-3.608 1.311-1.266.058-1.646.069-4.85.069s-3.584-.012-4.85-.069c-1.366-.062-2.633-.336-3.608-1.311-.975-.975-1.249-2.242-1.311-3.608C2.175 15.747 2.163 15.367 2.163 12s.012-3.584.07-4.85c.062-1.366.336-2.633 1.311-3.608.975-.975 2.242-1.249 3.608-1.311C8.416 2.175 8.796 2.163 12 2.163zm0-2.163C8.741 0 8.332.014 7.052.072 5.775.13 4.602.396 3.635 1.363 2.668 2.33 2.402 3.503 2.344 4.78.014 8.332 0 8.741 0 12c0 3.259.014 3.668.072 4.948.058 1.277.324 2.45 1.291 3.417.967.967 2.14 1.233 3.417 1.291C8.332 23.986 8.741 24 12 24s3.668-.014 4.948-.072c1.277-.058 2.45-.324 3.417-1.291.967-.967 1.233-2.14 1.291-3.417.058-1.28.072-1.689.072-4.948 0-3.259-.014-3.668-.072-4.948-.058-1.277-.324-2.45-1.291-3.417C19.398.396 18.225.13 16.948.072 15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
  },
  {
    name: 'TikTok',
    href: 'https://tiktok.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-5">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V9.05a8.16 8.16 0 0 0 4.77 1.52V7.12a4.85 4.85 0 0 1-1.84-.43z" />
      </svg>
    ),
  },
  {
    name: 'X',
    href: 'https://x.com',
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="size-5">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
]

export default function SiteFooter() {
  return (
    <footer className="relative mt-20 border-t border-white/5 bg-gradient-to-b from-black to-neutral-950">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-coral/40 to-transparent"
      />

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr_1fr_1.1fr]">
          {/* Brand */}
          <div>
            <Link to="/" className="font-display inline-block text-2xl font-black tracking-tight text-brand-coral">
              MOVIE<span className="text-white">+</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400">
              Nền tảng xem phim streaming chuyên nghiệp — kho phim Việt, Á, Âu Mỹ; phụ đề chuẩn,
              thuyết minh lồng tiếng đa dạng; gợi ý cá nhân hoá bằng AI.
            </p>
            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Theo dõi chúng tôi
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {SOCIAL.map((s) => (
                  <a
                    key={s.name}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={s.name}
                    className="grid size-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-400 transition hover:-translate-y-0.5 hover:border-brand-coral/50 hover:bg-brand-coral/10 hover:text-brand-coral"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Khám phá */}
          <div>
            <h4 className="font-display mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Khám phá
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-zinc-400 transition hover:text-brand-coral">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link to="/explore" className="text-zinc-400 transition hover:text-brand-coral">
                  Kho phim
                </Link>
              </li>
              <li>
                <Link to="/charts" className="text-zinc-400 transition hover:text-brand-coral">
                  Bảng xếp hạng
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-zinc-400 transition hover:text-brand-coral">
                  Tìm kiếm
                </Link>
              </li>
              <li>
                <Link to="/vip" className="font-medium text-brand-gold transition hover:text-amber-300">
                  ★ Gói VIP
                </Link>
              </li>
            </ul>
          </div>

          {/* Của tôi */}
          <div>
            <h4 className="font-display mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Của tôi
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/profile" className="text-zinc-400 transition hover:text-brand-coral">
                  Tài khoản
                </Link>
              </li>
              <li>
                <Link to="/watchlist" className="text-zinc-400 transition hover:text-brand-coral">
                  Danh sách xem sau
                </Link>
              </li>
              <li>
                <Link to="/history" className="text-zinc-400 transition hover:text-brand-coral">
                  Lịch sử xem
                </Link>
              </li>
              <li>
                <Link to="/devices" className="text-zinc-400 transition hover:text-brand-coral">
                  Thiết bị
                </Link>
              </li>
              <li>
                <Link to="/notifications" className="text-zinc-400 transition hover:text-brand-coral">
                  Thông báo
                </Link>
              </li>
            </ul>
          </div>

          {/* Hỗ trợ */}
          <div>
            <h4 className="font-display mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Hỗ trợ
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-zinc-400 transition hover:text-brand-coral"
                >
                  Liên hệ CSKH
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Câu hỏi thường gặp')}`}
                  className="text-zinc-400 transition hover:text-brand-coral"
                >
                  Câu hỏi thường gặp
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Hướng dẫn xem phim')}`}
                  className="text-zinc-400 transition hover:text-brand-coral"
                >
                  Hướng dẫn xem phim
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Báo cáo lỗi')}`}
                  className="text-zinc-400 transition hover:text-brand-coral"
                >
                  Báo cáo lỗi
                </a>
              </li>
              <li>
                <a
                  href="tel:19001234"
                  className="text-zinc-400 transition hover:text-brand-coral"
                >
                  Hotline 1900 1234
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/5 pt-6 text-xs text-zinc-500 md:flex-row md:items-center">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <p>© {new Date().getFullYear()} Movie+ · Mọi quyền được bảo lưu.</p>
            <span className="hidden text-zinc-700 md:inline">|</span>
            <a
              href={`mailto:${LEGAL_EMAIL}?subject=${encodeURIComponent('Yêu cầu điều khoản dịch vụ')}`}
              className="transition hover:text-brand-coral"
            >
              Điều khoản dịch vụ
            </a>
            <a
              href={`mailto:${LEGAL_EMAIL}?subject=${encodeURIComponent('Yêu cầu chính sách bảo mật')}`}
              className="transition hover:text-brand-coral"
            >
              Chính sách bảo mật
            </a>
            <a
              href={`mailto:${LEGAL_EMAIL}?subject=${encodeURIComponent('Yêu cầu chính sách cookie')}`}
              className="transition hover:text-brand-coral"
            >
              Cookie
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
