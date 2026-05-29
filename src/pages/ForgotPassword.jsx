import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as authApi from '../services/authApi'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    document.title = 'Quên mật khẩu — VieStream'
  }, [])

  async function onSubmit(e) {
    e.preventDefault()
    setErr('')
    setMsg('')
    const trimmed = String(email).trim()
    if (!trimmed || !trimmed.includes('@')) {
      setErr('Vui lòng nhập email hợp lệ.')
      return
    }
    setLoading(true)
    try {
      const body = await authApi.forgotPassword(trimmed)
      // Server xóa refresh token — bỏ JWT cũ tránh /me 401 (Unauthenticated) sau khi đăng nhập lại.
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      setMsg(body?.message || 'Đã xử lý yêu cầu.')
    } catch (er) {
      const d = er.response?.data
      const msg =
        (typeof d?.message === 'string' && d.message) ||
        (d?.code != null ? `Lỗi ${d.code}` : '') ||
        er.message ||
        'Không gửi được yêu cầu. Kiểm tra backend đang chạy và VITE_API_URL (nếu có).'
      setErr(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950/70 p-8 shadow-xl">
          <Link to="/login" className="text-sm font-semibold text-emerald-400 hover:underline">
            ← Đăng nhập
          </Link>
          <h1 className="mt-6 font-display text-2xl font-bold text-white">Quên mật khẩu</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Nhập email đã đăng ký (tài khoản có mật khẩu, không phải chỉ Google). Hệ thống sẽ đặt mật khẩu mới và gửi qua email.
          </p>

          <form className="mt-8 space-y-5" noValidate onSubmit={onSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-400">Email</label>
              <input
                autoComplete="email"
                type="text"
                inputMode="email"
                placeholder="ten@example.com"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-zinc-100 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
            {msg ? (
              <div className="space-y-2 rounded-lg border border-emerald-500/40 bg-emerald-950/50 px-3 py-2 text-sm text-emerald-100">
                <p>{msg}</p>
                <p className="text-xs text-emerald-200/80">
                  Không thấy mail? Kiểm tra spam và xem lại email có trùng hệ thống đăng ký. Bạn vẫn có thể bấm gửi lại.
                </p>
              </div>
            ) : null}
            {err ? (
              <p className="rounded-lg border border-red-500/40 bg-red-950/60 px-3 py-2 text-sm text-red-200">{err}</p>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-black hover:bg-emerald-400 disabled:opacity-50"
            >
              {loading ? 'Đang gửi…' : 'Gửi mật khẩu mới qua email'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
