import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import GoogleSignInButton from '../components/GoogleSignInButton.jsx'
import { useAuth } from '../context/useAuth.js'
import * as authService from '../services/authService'

export default function Register() {
  const { user, initializing, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleBusy, setGoogleBusy] = useState(false)

  useEffect(() => {
    document.title = 'Đăng ký — VieStream'
  }, [])

  const onGoogleResult = useCallback(
    async ({ credential, error }) => {
      setErr('')
      if (error) {
        setErr(error.message || 'Đăng ký / đăng nhập Google thất bại')
        return
      }
      setGoogleBusy(true)
      try {
        await loginWithGoogle(credential)
        navigate('/dashboard', { replace: true })
      } catch (e) {
        setErr(e.response?.data?.message || e.message || 'Đăng ký / đăng nhập Google thất bại')
      } finally {
        setGoogleBusy(false)
      }
    },
    [loginWithGoogle, navigate]
  )

  if (!initializing && user) {
    return <Navigate to="/dashboard" replace />
  }

  async function onSubmit(ev) {
    ev.preventDefault()
    setErr('')
    setLoading(true)
    try {
      await authService.registerAccount({ email: email.trim(), password, name: name.trim() })
      navigate('/login', { replace: true, state: { regOk: true } })
    } catch (e) {
      setErr(e.response?.data?.message || e.message || 'Đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950/80 p-8">
        <h1 className="text-2xl font-bold text-white">Đăng ký</h1>
        <p className="mt-1 text-sm text-zinc-500">Tạo tài khoản VieStream để lưu lịch sử và gợi ý phim.</p>
        <div className="mt-6">
          <GoogleSignInButton onCredential={onGoogleResult} disabled={googleBusy || loading} />
        </div>
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-zinc-950/80 px-2 text-[10px] uppercase tracking-wider text-zinc-600">hoặc form</span>
          </div>
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-sm"
          />
          <input
            required
            type="password"
            minLength={6}
            placeholder="Mật khẩu (≥6)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-sm"
          />
          <input
            placeholder="Tên hiển thị (tuỳ chọn)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-sm"
          />
          {err ? <p className="text-sm text-red-400">{err}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-black disabled:opacity-50"
          >
            {loading ? '…' : 'Tạo tài khoản'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-500">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-emerald-400">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  )
}
