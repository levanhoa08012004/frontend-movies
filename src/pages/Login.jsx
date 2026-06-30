import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import GoogleSignInButton from '../components/GoogleSignInButton.jsx'
import { useAuth } from '../context/useAuth.js'

/**
 * Redirect đích sau login theo role:
 * - ADMIN → bảng điều khiển admin
 * - CARE  → dashboard chăm sóc khách hàng
 * - USER  → trang user đã yêu cầu trước login, hoặc trang chủ
 */
function roleHome(u, location) {
  if (!u) return '/'
  if (u.role === 'ADMIN') return '/quan-tri'
  if (u.role === 'CARE') return '/quan-tri/cham-soc'
  return location?.state?.from?.pathname || '/'
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, loginWithGoogle, user, initializing } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [googleBusy, setGoogleBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const regOk = location.state?.regOk
  const pwdChangedMsg = location.state?.pwdMessage

  useEffect(() => {
    document.title = 'Đăng nhập — VieStream'
  }, [])

  const onGoogleResult = useCallback(
    async ({ credential, error }) => {
      setError('')
      if (error) {
        setError(error.message || 'Đăng nhập Google thất bại')
        return
      }
      setGoogleBusy(true)
      try {
        const u = await loginWithGoogle(credential)
        navigate(roleHome(u, location), { replace: true })
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          err.response?.statusText ||
          err.message ||
          'Đăng nhập Google thất bại'
        setError(String(msg))
      } finally {
        setGoogleBusy(false)
      }
    },
    [loginWithGoogle, navigate]
  )

  if (!initializing && user) {
    return <Navigate to={roleHome(user, location)} replace />
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const u = await login(email.trim(), password)
      navigate(roleHome(u, location), { replace: true })
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.statusText ||
        err.message ||
        'Đăng nhập thất bại'
      setError(String(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950/80 p-8 shadow-xl shadow-brand-coral/15 backdrop-blur">
          <Link
            to="/"
            className="font-display inline-block text-2xl font-bold tracking-tight text-brand-coral"
          >
            VieStream
          </Link>
          <p className="mt-1 text-sm text-zinc-500">
            Đăng nhập bằng email và mật khẩu hoặc tài khoản Google.
          </p>

          <div className="mt-6">
            <GoogleSignInButton onCredential={onGoogleResult} disabled={googleBusy || loading} />
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-700" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-zinc-950/70 px-3 text-xs uppercase tracking-wider text-zinc-600">hoặc</span>
            </div>
          </div>

          <form className="space-y-5" onSubmit={onSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-400">Email</label>
              <input
                autoComplete="email"
                required
                type="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                placeholder="your@mail.com"
                className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-zinc-100 outline-none transition focus:border-brand-coral focus:ring-2 focus:ring-brand-coral/40"
              />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label className="text-sm font-medium text-zinc-400">Mật khẩu</label>
                <Link to="/quen-mat-khau" className="text-xs font-semibold text-brand-coral hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>
              <input
                autoComplete="current-password"
                required
                type="password"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-zinc-100 outline-none transition focus:border-brand-coral focus:ring-2 focus:ring-brand-coral/40"
              />
            </div>

            {regOk ? (
              <p className="rounded-lg border border-brand-coral/40 bg-brand-coral/10 px-3 py-2 text-sm text-brand-coral">
                Đăng ký thành công — đăng nhập để tiếp tục.
              </p>
            ) : null}
            {pwdChangedMsg ? (
              <p className="rounded-lg border border-sky-500/40 bg-sky-950/50 px-3 py-2 text-sm text-sky-100">{pwdChangedMsg}</p>
            ) : null}

            {error ? (
              <p className="rounded-lg border border-red-500/40 bg-red-950/60 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-brand-coral py-3 text-sm font-semibold text-white shadow-lg shadow-brand-coral/25 transition hover:bg-brand-accent disabled:cursor-not-allowed disabled:bg-zinc-600"
            >
              {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-medium text-brand-coral hover:underline">
              Tạo tài khoản miễn phí
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
