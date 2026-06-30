import { useEffect, useState } from 'react'
import { ensureDeviceId } from '../services/api.js'
import * as deviceApi from '../services/deviceApi'

export default function Devices() {
  const [devices, setDevices] = useState([])
  const [deviceName, setDeviceName] = useState('')
  const [msg, setMsg] = useState('')

  async function refresh() {
    const list = await deviceApi.listDevices()
    setDevices(Array.isArray(list) ? list : [])
  }

  useEffect(() => {
    document.title = 'Thiết bị — VieStream'
    refresh().catch(() => setDevices([]))
  }, [])

  async function register(ev) {
    ev.preventDefault()
    setMsg('')
    try {
      await deviceApi.registerDevice({
        deviceId: ensureDeviceId(),
        deviceName: deviceName || 'Web client',
      })
      setMsg('Đã đăng ký thiết bị.')
      setDeviceName('')
      await refresh()
    } catch (e) {
      setMsg(e.response?.data?.message || e.message)
    }
  }

  async function revoke(id) {
    await deviceApi.revokeDevice(id)
    await refresh()
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8">
      <h1 className="text-3xl font-bold text-white">Thiết bị</h1>
      <p className="mt-1 text-sm text-zinc-400">Quản lý thiết bị đã đăng nhập — có thể gỡ thiết bị không còn dùng.</p>

      <form onSubmit={register} className="mt-8 flex flex-wrap gap-2">
        <input
          placeholder="Tên thiết bị (tuỳ chọn)"
          value={deviceName}
          onChange={(e) => setDeviceName(e.target.value)}
          className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-xl bg-brand-coral px-4 py-2 text-sm font-semibold text-white hover:bg-brand-accent">
          Đăng ký lại
        </button>
      </form>

      <ul className="mt-8 space-y-3">
        {devices.map((d) => (
          <li
            key={d.id}
            className="flex items-center justify-between rounded-xl border border-zinc-800 px-4 py-3 text-sm"
          >
            <div>
              <p className="text-zinc-200">{d.deviceName || d.deviceId || 'Device'}</p>
              <p className="text-xs text-zinc-600">{d.userAgent}</p>
            </div>
            <button type="button" className="text-xs text-red-400" onClick={() => revoke(d.id)}>
              Thu hồi
            </button>
          </li>
        ))}
      </ul>

      {msg ? <p className="mt-6 text-sm text-amber-200">{msg}</p> : null}
    </div>
  )
}
