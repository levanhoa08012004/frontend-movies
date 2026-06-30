import { useState } from 'react'
import { Link } from 'react-router-dom'
import JsonView from '../components/JsonView.jsx'
import * as recommendationApi from '../services/recommendationApi'
import { useAuth } from '../context/useAuth.js'

export default function Recommendations() {
  const { user } = useAuth()
  const tier = user?.vipTier || 'NONE'
  const isVip = tier !== 'NONE' || user?.role === 'ADMIN'

  const [body1, setBody1] = useState('{}')
  const [body2, setBody2] = useState('{}')
  const [out1, setOut1] = useState(null)
  const [out2, setOut2] = useState(null)
  const [out3, setOut3] = useState(null)
  const [err, setErr] = useState('')

  if (!isVip) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-8">
        <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] via-zinc-950 to-zinc-950 p-10 shadow-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">Đặc quyền VIP</p>
          <h1 className="font-display mt-2 text-3xl font-bold text-white sm:text-4xl">
            Gợi ý AI dành riêng cho thành viên VIP
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-zinc-300">
            Hệ thống gợi ý cá nhân hoá bằng AI (nhập query tự nhiên, hiểu ngữ cảnh, học theo
            sở thích) là đặc quyền của các gói <strong className="text-white">VIP / VIPPRO / PRIME</strong>.
            Nâng cấp để mở khoá tìm kiếm hội thoại + đề xuất "Dành riêng cho bạn".
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/vip"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-coral px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-coral/30 hover:bg-brand-accent"
            >
              Xem gói VIP →
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-zinc-200 hover:border-brand-coral/40"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    )
  }

  async function runMl() {
    setErr('')
    try {
      const json = body1.trim() ? JSON.parse(body1) : {}
      setOut1(await recommendationApi.recommend(json))
    } catch (e) {
      setErr(e.message)
    }
  }

  async function runGen() {
    setErr('')
    try {
      const json = body2.trim() ? JSON.parse(body2) : {}
      setOut2(await recommendationApi.recommendGenerative(json))
    } catch (e) {
      setErr(e.message)
    }
  }

  async function runPersonal() {
    setErr('')
    try {
      setOut3(await recommendationApi.recommendPersonalized())
    } catch (e) {
      setErr(e.response?.data?.message || e.message)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
      <h1 className="text-3xl font-bold text-white">Gợi ý phim</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Ba cách khác nhau: gợi ý khi gửi dữ liệu JSON tuỳ chọn, gợi ý mô hình nâng cao với payload tương tự, và gợi ý dựa trên hoạt động của tài khoản bạn.
      </p>

      {err ? <p className="mt-4 text-red-400">{err}</p> : null}

      <section className="mt-10 space-y-4">
        <h2 className="text-lg font-semibold text-white">Gợi ý theo đầu vào (ML)</h2>
        <textarea
          value={body1}
          onChange={(e) => setBody1(e.target.value)}
          rows={6}
          className="w-full rounded-xl border border-white/10 bg-black p-4 font-mono text-xs text-zinc-200 focus:border-brand-coral/40 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => runMl()}
          className="rounded-xl bg-brand-coral px-4 py-2 text-sm font-semibold text-white hover:bg-brand-accent"
        >
          Gửi
        </button>
        {out1 != null ? <JsonView value={out1} /> : null}
      </section>

      <section className="mt-14 space-y-4">
        <h2 className="text-lg font-semibold text-white">Gợi ý mở rộng</h2>
        <textarea
          value={body2}
          onChange={(e) => setBody2(e.target.value)}
          rows={6}
          className="w-full rounded-xl border border-white/10 bg-black p-4 font-mono text-xs text-zinc-200 focus:border-brand-coral/40 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => runGen()}
          className="rounded-xl bg-brand-coral px-4 py-2 text-sm font-semibold text-white hover:bg-brand-accent"
        >
          Gửi
        </button>
        {out2 != null ? <JsonView value={out2} /> : null}
      </section>

      <section className="mt-14 space-y-4">
        <h2 className="text-lg font-semibold text-white">Gợi ý cho bạn</h2>
        <button
          type="button"
          onClick={() => runPersonal()}
          className="rounded-xl border border-zinc-600 px-4 py-2 text-sm text-zinc-200"
        >
          Tải gợi ý cá nhân
        </button>
        {out3 != null ? <JsonView value={out3} /> : null}
      </section>
    </div>
  )
}
