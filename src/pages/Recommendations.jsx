import { useState } from 'react'
import JsonView from '../components/JsonView.jsx'
import * as recommendationApi from '../services/recommendationApi'

export default function Recommendations() {
  const [body1, setBody1] = useState('{}')
  const [body2, setBody2] = useState('{}')
  const [out1, setOut1] = useState(null)
  const [out2, setOut2] = useState(null)
  const [out3, setOut3] = useState(null)
  const [err, setErr] = useState('')

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
          className="w-full rounded-xl border border-zinc-700 bg-black p-4 font-mono text-xs text-emerald-200"
        />
        <button
          type="button"
          onClick={() => runMl()}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-black"
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
          className="w-full rounded-xl border border-zinc-700 bg-black p-4 font-mono text-xs text-emerald-200"
        />
        <button
          type="button"
          onClick={() => runGen()}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-black"
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
