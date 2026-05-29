import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth.js'
import * as paymentApi from '../services/paymentApi'

/** Bật spinner trên một gói khi chờ redirect VNPay — không có bước “tạo URL”. */
export default function Vip() {
  const { refreshUser } = useAuth()
  const [params, setParams] = useSearchParams()
  const [plans, setPlans] = useState([])
  const [msg, setMsg] = useState('')
  const [payingTier, setPayingTier] = useState(null)

  useEffect(() => {
    document.title = 'Gói VIP — VieStream'
    paymentApi
      .vipPlans()
      .then((p) => setPlans(Array.isArray(p) ? p : []))
      .catch(() => setPlans([]))
  }, [])

  useEffect(() => {
    const p = params.get('payment')
    if (!p) return
    const reason = params.get('reason')
    if (p === 'ok') {
      setMsg('Thanh toán thành công. Đang làm mới thông tin gói của bạn…')
      refreshUser().catch(() => {})
    } else if (p === 'fail') {
      setMsg('Thanh toán chưa hoàn tất hoặc bị từ chối.')
    } else {
      setMsg(reason ? `Không xác nhận được giao dịch: ${reason}` : 'Không xác nhận được giao dịch.')
    }
    const next = new URLSearchParams(params)
    next.delete('payment')
    next.delete('code')
    next.delete('reason')
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
      setMsg(String(url || 'Không nhận được cổng thanh toán.'))
    } catch (e) {
      const apiMsg = e.response?.data?.message
      setMsg(
        apiMsg ||
          (e.response?.status === 503
            ? 'Cổng thanh toán chưa được cấu hình đủ — cần mã cửa hàng VNPAY.'
            : e.message)
      )
    } finally {
      setPayingTier(null)
    }
  }

  return (
    <div className="relative mx-auto max-w-[1100px] px-5 py-10 sm:px-8 lg:py-14">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_90%_60%_at_50%_-20%,rgba(225,29,72,0.15),transparent)]" />

      <header className="relative text-center lg:text-left">
        <p className="font-display text-sm font-bold uppercase tracking-[0.25em] text-brand-coral/90">VieStream VIP</p>
        <h1 className="font-display mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl">Chọn gói của bạn</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-zinc-400 lg:mx-0 lg:text-lg">
          Bấm vào ô gói — hệ thống chuyển thẳng sang cổng VNPAY. Không cần copy URL hay bước trung gian.
        </p>
      </header>

      <div className="relative mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(plans.length ? plans : []).map((p, idx) => {
          const active = payingTier === p.tier
          const spotlight = idx === 1
          return (
            <div
              key={p.tier}
              className={`relative flex flex-col rounded-3xl border p-8 transition ${
                spotlight
                  ? 'border-brand-coral/55 bg-gradient-to-b from-brand-coral/18 via-brand-panel to-brand-ink shadow-2xl shadow-brand-coral/10 ring-1 ring-brand-coral/35'
                  : 'border-white/[0.09] bg-brand-panel hover:border-brand-coral/35'
              }`}
            >
              {spotlight ? (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-brand-coral/45 bg-brand-coral/25 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                  Phổ biến
                </span>
              ) : null}
              <p className="font-display text-2xl font-bold text-white">{p.tier}</p>
              <p className="mt-6 font-display text-3xl font-bold text-brand-gold md:text-[2rem]">
                {p.priceVnd != null ? `${p.priceVnd.toLocaleString('vi-VN')} đ` : '—'}{' '}
                <span className="text-base font-normal text-zinc-500">/ tháng</span>
              </p>
              <p className="mt-6 flex-1 leading-relaxed text-zinc-400">{p.summary || 'Đăng ký để xem thêm đặc quyền.'}</p>
              <button
                type="button"
                disabled={Boolean(payingTier)}
                onClick={() => startPayment(p.tier)}
                className={`mt-10 min-h-[54px] w-full rounded-xl text-lg font-bold transition ${
                  spotlight
                    ? 'bg-brand-coral text-white shadow-lg shadow-brand-coral/35 hover:bg-rose-500'
                    : 'border border-white/15 bg-white/[0.06] text-white hover:border-brand-coral/40 hover:bg-brand-coral/15'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {active ? 'Đang mở VNPAY…' : `Thanh toán ${p.tier}`}
              </button>
            </div>
          )
        })}
      </div>

      {msg ? (
        <div className="relative mt-10 rounded-2xl border border-amber-500/35 bg-amber-950/30 px-6 py-4 text-center text-[15px] text-amber-100">
          {msg}
        </div>
      ) : null}

      <p className="relative mx-auto mt-12 max-w-2xl text-center text-sm text-zinc-600">
        Sau khi thanh toán, cổng VNPAY đưa bạn quay về VieStream và cập nhật gói tự động.
      </p>
    </div>
  )
}
