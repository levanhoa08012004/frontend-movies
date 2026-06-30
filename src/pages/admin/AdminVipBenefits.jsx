import { useEffect, useState } from 'react'
import AdminPageShell from '../../components/AdminPageShell.jsx'
import {
  adminListBenefitDefs,
  adminCreateBenefitDef,
  adminUpdateBenefitDef,
  adminDeleteBenefitDef,
} from '../../services/adminVipApi.js'

const EMPTY = {
  code: '',
  displayName: '',
  description: '',
  valueType: 'TEXT',
  defaultValue: '',
  icon: '',
  sortOrder: 100,
  active: true,
}

export default function AdminVipBenefits() {
  const [defs, setDefs] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)   // null | {} | def
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function reload() {
    setLoading(true)
    try {
      setDefs(await adminListBenefitDefs())
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { reload().catch(() => {}) }, [])

  function openCreate() {
    setEditing({})
    setForm(EMPTY)
    setErr('')
  }

  function openEdit(def) {
    setEditing(def)
    setForm({
      code: def.code,
      displayName: def.displayName || '',
      description: def.description || '',
      valueType: def.valueType || 'TEXT',
      defaultValue: def.defaultValue || '',
      icon: def.icon || '',
      sortOrder: def.sortOrder ?? 0,
      active: def.active,
    })
    setErr('')
  }

  function close() {
    if (busy) return
    setEditing(null)
    setForm(EMPTY)
  }

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      if (editing && editing.code) {
        await adminUpdateBenefitDef(editing.code, form)
      } else {
        await adminCreateBenefitDef(form)
      }
      await reload()
      setEditing(null)
    } catch (ex) {
      setErr(ex?.response?.data?.message || ex.message || 'Lỗi lưu')
    } finally {
      setBusy(false)
    }
  }

  async function remove(def) {
    if (!window.confirm(`Xoá đặc quyền "${def.displayName}"?`)) return
    try {
      await adminDeleteBenefitDef(def.code)
      await reload()
    } catch (ex) {
      setErr(ex?.response?.data?.message || ex.message)
    }
  }

  return (
    <AdminPageShell
      eyebrow="Quản lý VIP"
      title="Đặc quyền VIP"
      subtitle="Danh sách các đặc quyền hiển thị trên trang /vip. Đặc quyền hệ thống (lock) không xoá được, đặc quyền marketing admin tự do thêm/sửa/xoá."
      actions={
        <button onClick={openCreate}
          className="rounded-xl bg-brand-coral px-5 py-2 text-sm font-bold text-white shadow-md shadow-brand-coral/30 hover:bg-brand-accent">
          + Thêm đặc quyền
        </button>
      }
    >
      {err ? (
        <p className="mb-4 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">{err}</p>
      ) : null}

      {loading ? (
        <p className="text-zinc-500">Đang tải…</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-left text-xs uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-4 py-3">Icon</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Tên hiển thị</th>
                <th className="px-4 py-3">Mô tả</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Hệ thống?</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {defs.map((d) => (
                <tr key={d.code} className="border-t border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-xl">{d.icon || '·'}</td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-400">{d.code}</td>
                  <td className="px-4 py-3 font-semibold text-white">{d.displayName}</td>
                  <td className="px-4 py-3 max-w-xs truncate text-zinc-400">{d.description}</td>
                  <td className="px-4 py-3"><span className="rounded bg-white/5 px-2 py-0.5 text-xs">{d.valueType}</span></td>
                  <td className="px-4 py-3 tabular-nums">{d.sortOrder}</td>
                  <td className="px-4 py-3">
                    {d.codeEnforced
                      ? <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs text-amber-300">Có (lock)</span>
                      : <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-300">Marketing</span>}
                  </td>
                  <td className="px-4 py-3">{d.active ? '✓' : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <ActionButton variant="primary" onClick={() => openEdit(d)}>
                        ✎ Sửa
                      </ActionButton>
                      {d.active ? (
                        <ActionButton
                          variant="warning"
                          onClick={async () => {
                            try {
                              await adminUpdateBenefitDef(d.code, { active: false })
                              reload()
                            } catch (ex) {
                              setErr(ex?.response?.data?.message || ex.message)
                            }
                          }}
                        >
                          ⊘ Ẩn
                        </ActionButton>
                      ) : (
                        <ActionButton
                          variant="success"
                          onClick={async () => {
                            try {
                              await adminUpdateBenefitDef(d.code, { active: true })
                              reload()
                            } catch (ex) {
                              setErr(ex?.response?.data?.message || ex.message)
                            }
                          }}
                        >
                          ✓ Bật lại
                        </ActionButton>
                      )}
                      {!d.codeEnforced && (
                        <ActionButton variant="danger" onClick={() => remove(d)}>
                          🗑 Xoá
                        </ActionButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!defs.length && (
                <tr><td colSpan={9} className="px-4 py-6 text-center text-zinc-500">Chưa có đặc quyền nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {editing !== null && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 px-4 py-10 backdrop-blur-sm"
          onClick={close}
        >
          <form onClick={(e) => e.stopPropagation()} onSubmit={save}
            className="w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl">
            <h3 className="font-display text-xl font-bold text-white">
              {editing.code ? `Sửa: ${editing.displayName}` : 'Thêm đặc quyền mới'}
            </h3>
            {editing.codeEnforced && (
              <p className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                Đặc quyền hệ thống — chỉ sửa được tên, mô tả, icon, thứ tự, active.
              </p>
            )}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Code (unique, in hoa, không khoảng trắng)">
                <input value={form.code} disabled={!!editing.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, '_') })}
                  required
                  className="vie-input-dark font-mono" placeholder="VD: SPOTIFY_BONUS" />
              </Field>
              <Field label="Icon (emoji hoặc tên)">
                <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="vie-input-dark" placeholder="🎵" maxLength={50} />
              </Field>
              <Field label="Tên hiển thị" full>
                <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} required
                  className="vie-input-dark" placeholder="Tặng kèm 30 ngày Spotify" />
              </Field>
              <Field label="Mô tả" full>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2} className="vie-input-dark" placeholder="Mô tả chi tiết cho user trên trang /vip" />
              </Field>
              <Field label="Kiểu giá trị">
                <select value={form.valueType} disabled={editing.codeEnforced}
                  onChange={(e) => setForm({ ...form, valueType: e.target.value })} className="vie-input-dark">
                  <option value="TEXT">TEXT (chuỗi)</option>
                  <option value="INT">INT (số)</option>
                  <option value="BOOL">BOOL (true/false)</option>
                </select>
              </Field>
              <Field label={`Giá trị mặc định (cho tier mới)${form.valueType === 'BOOL' ? ' — "true" / "false"' : form.valueType === 'INT' ? ' — số nguyên (-1 = vô hạn)' : ''}`}>
                <input
                  value={form.defaultValue}
                  onChange={(e) => setForm({ ...form, defaultValue: e.target.value })}
                  className="vie-input-dark"
                  placeholder={form.valueType === 'INT' ? '720' : form.valueType === 'BOOL' ? 'false' : '720p'}
                />
              </Field>
              <Field label="Thứ tự hiển thị">
                <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                  className="vie-input-dark" />
              </Field>
              <Field label="Trạng thái">
                <label className="flex h-12 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-zinc-200">
                  <input type="checkbox" checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })} />
                  Hiển thị trên trang /vip
                </label>
              </Field>
            </div>

            {err && <p className="mt-4 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">{err}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={close} disabled={busy}
                className="rounded-xl border border-white/15 px-5 py-2 text-sm font-semibold text-zinc-200 hover:bg-white/5">Huỷ</button>
              <button type="submit" disabled={busy}
                className="rounded-xl bg-brand-coral px-5 py-2 text-sm font-bold text-white shadow-md shadow-brand-coral/30 hover:bg-brand-accent disabled:opacity-50">
                {busy ? 'Đang lưu…' : 'Lưu'}
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminPageShell>
  )
}

function Field({ label, children, full }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</label>
      {children}
    </div>
  )
}

function ActionButton({ variant = 'primary', onClick, children }) {
  const styles = {
    primary: 'border-zinc-700 bg-zinc-800/70 text-zinc-100 hover:bg-zinc-700 hover:border-zinc-600',
    success: 'border-emerald-700/60 bg-emerald-600/15 text-emerald-200 hover:bg-emerald-600/25 hover:border-emerald-600',
    warning: 'border-amber-700/60 bg-amber-600/15 text-amber-200 hover:bg-amber-600/25 hover:border-amber-600',
    danger:  'border-red-800/60 bg-red-600/15 text-red-200 hover:bg-red-600/25 hover:border-red-600',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition ${styles[variant] || styles.primary}`}
    >
      {children}
    </button>
  )
}
