import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import * as paymentApi from '../services/paymentApi'

const PERIOD_LABEL = {
  MONTH: '/tháng',
  QUARTER: '/quý',
  YEAR: '/năm',
}

const formatVnd = (n) =>
  n == null ? '—' : Number(n).toLocaleString('vi-VN') + '₫'

const FAQS = [
  {
    q: 'Tôi có thể huỷ gói VIP bất cứ lúc nào không?',
    a: 'Bạn có thể ngừng gia hạn bất cứ lúc nào — tài khoản giữ quyền lợi VIP đến hết chu kỳ đã thanh toán.',
  },
  {
    q: 'Một tài khoản VIP có dùng được trên nhiều thiết bị không?',
    a: 'Tuỳ gói. VIP Cơ Bản dùng 2 thiết bị cùng lúc, VIP Plus 3 và VIP Prime 4.',
  },
  {
    q: 'Phương thức thanh toán nào được hỗ trợ?',
    a: 'Hiện tại Movie+ hỗ trợ VNPay (thẻ ATM nội địa, Internet Banking, Visa/Master, QR Pay…).',
  },
  {
    q: 'Sau khi thanh toán, gói VIP có lập tức kích hoạt không?',
    a: 'Có. Khi VNPay xác nhận giao dịch, tài khoản được nâng cấp trong vòng vài giây.',
  },
  {
    q: 'Cosmetic items (khung avatar, badge…) có theo tài khoản hay theo thiết bị?',
    a: 'Theo tài khoản. Đăng nhập trên bất kỳ thiết bị nào cũng giữ nguyên vật phẩm bạn đã trang bị.',
  },
]

export default function Vip() {
  const { user, refreshUser } = useAuth()
  const [params, setParams] = useSearchParams()
  const [data, setData] = useState(null)        // { tiers, definitions, matrix }
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState('')
  const [payingTier, setPayingTier] = useState(null)
  const [openFaq, setOpenFaq] = useState(null)

  useEffect(() => {
    document.title = 'Gói VIP — Movie+'
    paymentApi.vipBenefitsMatrix()
      .then((d) => setData(d))
      .catch(() => setData({ tiers: [], definitions: [], matrix: {} }))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const p = params.get('payment')
    if (!p) return
    const reason = params.get('reason')
    if (p === 'ok') {
      setMsg('Thanh toán thành công. Đang làm mới gói của bạn…')
      refreshUser().catch(() => {})
    } else if (p === 'fail') {
      setMsg('Thanh toán chưa hoàn tất hoặc bị từ chối.')
    } else {
      setMsg(reason ? `Không xác nhận được giao dịch: ${reason}` : 'Không xác nhận được giao dịch.')
    }
    const next = new URLSearchParams(params)
    next.delete('payment'); next.delete('code'); next.delete('reason')
    setParams(next, { replace: true })
  }, [params, setParams, refreshUser])

  async function startPayment(tier) {
    setMsg('')
    setPayingTier(tier)
    try {
      const url = await paymentApi.createVnPayPayment(tier)
      if (typeof url === 'string' && url.startsWith('http')) {
        window.location.href = url
        return
      }
      setMsg('Không nhận được cổng thanh toán.')
    } catch (e) {
      setMsg(e?.response?.data?.message || e?.message || 'Lỗi tạo URL VNPay.')
    } finally {
      setPayingTier(null)
    }
  }

  const tiers = useMemo(() => {
    const all = data?.tiers || []
    return all.filter((t) => t.code !== 'NONE')
  }, [data])

  const definitions = data?.definitions || []
  const matrix = data?.matrix || {}
  const userTier = user?.vipTier || 'NONE'

  function renderCell(tierCode, def) {
    const v = matrix[tierCode]?.[def.code]
    if (def.valueType === 'BOOL') {
      return v === true || v === 'true'
        ? <span className="text-brand-coral">✓</span>
        : <span className="text-zinc-700">—</span>
    }
    if (def.valueType === 'INT') {
      if (v == null) return <span className="text-zinc-700">—</span>
      if (Number(v) === -1) return <span className="text-brand-coral">Vô hạn</span>
      return <span className="text-white">{v}</span>
    }
    return v == null || v === '' ? <span className="text-zinc-700">—</span> : <span className="text-zinc-200">{String(v)}</span>
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-black via-neutral-950 to-zinc-950 pb-20">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(244,63,94,0.18),transparent)]" />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* Hero */}
        <section className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-coral">Mở khoá toàn bộ Movie+</p>
          <h1 className="font-display mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Chọn gói VIP phù hợp
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-zinc-400">
            Xem phim 4K, tải offline, vật phẩm trang trí độc quyền và nhiều đặc quyền khác.
            Huỷ bất cứ lúc nào.
          </p>
          {msg && (
            <p className="mx-auto mt-6 max-w-xl rounded-xl border border-brand-coral/30 bg-brand-coral/10 px-4 py-3 text-sm text-brand-coral">{msg}</p>
          )}
        </section>

        {/* Pricing cards */}
        {loading ? (
          <p className="mt-12 text-center text-zinc-500">Đang tải…</p>
        ) : (
          <section className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tiers.map((t, idx) => {
              const isCurrent = userTier === t.code
              const highlight = idx === 1   // middle card highlight
              return (
                <div key={t.code}
                  className={`relative rounded-3xl border p-6 transition ${
                    highlight
                      ? 'border-brand-coral/60 bg-gradient-to-b from-brand-coral/[0.08] to-transparent shadow-2xl shadow-brand-coral/15 scale-[1.02]'
                      : 'border-white/10 bg-white/[0.02] hover:border-brand-coral/40'
                  }`}>
                  {highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-coral px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-md">
                      Phổ biến nhất
                    </span>
                  )}
                  <p className="text-xs font-semibold uppercase tracking-widest text-brand-coral">{t.code}</p>
                  <h3 className="font-display mt-2 text-2xl font-bold text-white">{t.displayName}</h3>
                  <div className="mt-5 flex items-end gap-1">
                    <span className="font-display text-4xl font-bold text-white">{formatVnd(t.priceVnd)}</span>
                    <span className="mb-1 text-sm text-zinc-500">{PERIOD_LABEL[t.billingPeriod] || ''}</span>
                  </div>
                  {t.summary && <p className="mt-3 text-sm text-zinc-400">{t.summary}</p>}

                  {isCurrent ? (
                    <button disabled className="mt-6 w-full rounded-xl bg-emerald-500/20 px-5 py-3 text-sm font-bold text-emerald-300">
                      ✓ Gói hiện tại của bạn
                    </button>
                  ) : (
                    <button onClick={() => startPayment(t.code)} disabled={payingTier === t.code}
                      className={`mt-6 w-full rounded-xl px-5 py-3 text-sm font-bold transition disabled:opacity-50 ${
                        highlight
                          ? 'bg-brand-coral text-white shadow-lg shadow-brand-coral/30 hover:bg-brand-accent'
                          : 'border border-white/15 text-zinc-200 hover:border-brand-coral/50'
                      }`}>
                      {payingTier === t.code ? 'Đang chuyển…' : 'Đăng ký ngay'}
                    </button>
                  )}
                </div>
              )
            })}
          </section>
        )}

        {/* Cosmetic showcase — thay cho bảng so sánh quyền lợi */}
        <section className="mt-20">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-coral">Đặc quyền VIP</p>
              <h2 className="font-display mt-2 text-2xl font-bold text-white sm:text-3xl">
                Vật phẩm độc quyền — sang xịn hơn
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-zinc-400">
                Khung avatar lấp lánh, khung bình luận sang trọng, badge danh hiệu, banner profile, hiệu ứng tên animation —
                hiển thị ở mọi nơi bạn xuất hiện trên Movie+.
              </p>
            </div>
            <Link to="/profile/cosmetics"
              className="hidden shrink-0 rounded-full border border-brand-coral/40 px-5 py-2 text-sm font-semibold text-brand-coral transition hover:bg-brand-coral/10 sm:inline-flex">
              Xem tất cả →
            </Link>
          </div>

          {/* 4 showcase cards demo cosmetic */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ShowcaseCard
              tier="VIP"
              icon="🖼️"
              title="Khung avatar độc quyền"
              desc="Bạc · Vàng · Coral · Cầu vồng · Galaxy"
              accent="border-zinc-300/30 from-zinc-500/10 to-zinc-300/5"
              demo={
                <span className="frame-gold-classic inline-block">
                  <span className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-brand-coral to-amber-400 text-xl font-black text-white">VIP</span>
                </span>
              }
            />
            <ShowcaseCard
              tier="VIPPRO"
              icon="💬"
              title="Khung bình luận VIP"
              desc="Vàng · Tím · Lửa · Băng · Vũ trụ"
              accent="border-amber-400/30 from-amber-500/10 to-rose-500/5"
              demo={
                <div className="comment-frame-gold w-full rounded-lg p-3 text-left">
                  <p className="text-xs font-semibold text-white">Bạn 👑👑</p>
                  <p className="mt-0.5 text-[11px] text-zinc-200">Bình luận xịn của VIPPRO</p>
                </div>
              }
            />
            <ShowcaseCard
              tier="PRIME"
              icon="✨"
              title="Hiệu ứng tên animation"
              desc="Glow · Rainbow · Fire · Ice · Shimmer"
              accent="border-purple-400/30 from-purple-500/10 to-brand-coral/5"
              demo={<span className="name-effect-rainbow text-2xl font-bold">VIP Prime</span>}
            />
            <ShowcaseCard
              tier="PRIME"
              icon="🌅"
              title="Banner profile"
              desc="Vũ trụ · Cực quang · Hoàng hôn · Forest"
              accent="border-indigo-400/30 from-indigo-500/10 to-purple-500/5"
              demo={
                <div className="banner-cosmic flex h-20 w-full items-center justify-center rounded-lg">
                  <span className="text-sm font-bold text-white">@username</span>
                </div>
              }
            />
          </div>

          <div className="mt-8 rounded-3xl border border-brand-coral/30 bg-gradient-to-br from-brand-coral/10 via-transparent to-amber-500/10 p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-display text-lg font-bold text-white">
                  Đã đăng ký VIP? Trang bị vật phẩm ngay!
                </p>
                <p className="mt-1 text-sm text-zinc-400">
                  Chọn khung, badge, hiệu ứng tên — hiển thị trên avatar, comment, profile của bạn.
                </p>
              </div>
              <Link to="/profile/cosmetics"
                className="rounded-xl bg-brand-coral px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-coral/30 hover:bg-brand-accent">
                Mở kho vật phẩm →
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-coral">Câu hỏi thường gặp</p>
          <h2 className="font-display mt-2 text-2xl font-bold text-white sm:text-3xl">Cần tìm thêm thông tin?</h2>
          <div className="mt-8 space-y-3">
            {FAQS.map((f, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.02]">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                  <span className="font-semibold text-white">{f.q}</span>
                  <span className={`text-brand-coral transition ${openFaq === i ? 'rotate-180' : ''}`}>▼</span>
                </button>
                {openFaq === i && (
                  <p className="border-t border-white/5 px-5 py-4 text-sm leading-relaxed text-zinc-300">{f.a}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Payment methods */}
        <section className="mt-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Thanh toán an toàn qua</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            {['VNPAY', 'VISA', 'MASTERCARD', 'JCB', 'ATM'].map((p) => (
              <span key={p} className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-bold tracking-wide text-zinc-300">
                {p}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

function ShowcaseCard({ tier, icon, title, desc, accent, demo }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${accent} p-5`}>
      <span className="absolute right-3 top-3 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-300 backdrop-blur">
        {tier}+
      </span>
      <div className="flex h-32 items-center justify-center rounded-xl bg-gradient-to-br from-zinc-950/80 to-black/80 p-3">
        {demo}
      </div>
      <p className="mt-4 flex items-center gap-2 text-sm font-bold text-white">
        <span>{icon}</span>{title}
      </p>
      <p className="mt-1 text-xs text-zinc-400">{desc}</p>
    </div>
  )
}
