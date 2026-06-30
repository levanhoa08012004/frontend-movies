import { useState } from 'react'
import JsonView from '../../components/JsonView.jsx'
import { rebuildUserProfile } from '../../services/adminRecsysApi.js'

/**
 * Round 19 — "Đẩy dữ liệu LLM (recsys)" admin tool.
 *
 * Cronjob nightly tự rebuild user active 24h. Trang này dành cho admin force
 * rebuild ngoài lịch (debug profile lệch / sửa lỗi 1 user / chứng minh demo).
 */
export default function AdminRecsysProfile() {
  const [userId, setUserId] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [err, setErr] = useState('')

  async function onSubmit(ev) {
    ev.preventDefault()
    setErr('')
    setResult(null)
    const uid = Number(userId)
    if (!uid || uid <= 0) {
      setErr('Vui lòng nhập user ID hợp lệ (số nguyên dương).')
      return
    }
    setBusy(true)
    try {
      const data = await rebuildUserProfile(uid)
      setResult(data)
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || 'Rebuild thất bại.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <header className="mb-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">
          Recsys · Profile LLM
        </p>
        <h1 className="font-display mt-2 text-3xl font-bold text-white">
          Đẩy dữ liệu LLM (rebuild profile)
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
          Hệ thống đã có <strong className="text-zinc-200">cronjob nightly</strong> rebuild
          <code className="mx-1 rounded bg-white/10 px-1.5 py-0.5 text-xs">llm_profile</code>
          cho mọi user có hoạt động trong 24h. Form bên dưới dành cho admin
          <strong className="text-zinc-200"> force rebuild 1 user cụ thể </strong>
          ngoài lịch — dùng khi profile bị lệch, debug, hoặc demo. Pipeline gọi LLM (~30–60 giây),
          ghi kết quả vào <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">Data/user_profiles.json</code>
          và invalidate cache phía recsys.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6 shadow-lg"
      >
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            User ID (Spring)
          </span>
          <input
            type="number"
            min="1"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="VD: 42"
            disabled={busy}
            className="mt-2 w-full max-w-xs rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-amber-500/40 focus:outline-none disabled:opacity-50"
          />
          <span className="mt-2 block text-xs text-zinc-600">
            Python sẽ tự map sang <code className="rounded bg-white/5 px-1">u_{userId || '<id>'}</code>.
          </span>
        </label>

        {err ? (
          <p className="mt-4 rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-2.5 text-sm text-red-200">
            {err}
          </p>
        ) : null}

        <div className="mt-6 flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-black shadow-lg shadow-amber-500/25 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? (
              <>
                <svg
                  className="size-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M22 12a10 10 0 0 1-10 10" strokeLinecap="round" />
                </svg>
                Đang gọi LLM…
              </>
            ) : (
              'Rebuild profile'
            )}
          </button>
          {busy ? (
            <span className="text-xs text-zinc-500">
              Có thể mất 30–60 giây tuỳ throttle Groq/Cerebras.
            </span>
          ) : null}
        </div>
      </form>

      {result ? (
        <section className="mt-8">
          <header className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Kết quả</h2>
            {result.updated_at ? (
              <span className="text-xs text-zinc-500">
                Cập nhật: {new Date(result.updated_at).toLocaleString('vi-VN')}
              </span>
            ) : null}
          </header>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4">
            <p className="mb-3 text-sm text-emerald-200">
              ✓ Đã rebuild thành công cho <strong>{result.user_id}</strong> và lưu vào{' '}
              <code>Data/user_profiles.json</code>.
            </p>
            <JsonView value={result.profile} />
          </div>
        </section>
      ) : null}
    </div>
  )
}
