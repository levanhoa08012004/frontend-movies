import { useCallback, useEffect, useState } from 'react'
import AdminPageShell from '../components/AdminPageShell.jsx'
import { useAuth } from '../context/useAuth.js'
import * as adminApi from '../services/adminApi'

const ADMIN_USER_PAGE_SIZE = 12
const ROLE_OPTS = ['USER', 'ADMIN']
const VIP_OPTS = ['NONE', 'VIP', 'VIPPRO', 'PRIME']

const field = 'vie-input-dark vie-autofill-fix vie-datetime-dark min-h-[48px]'

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/12 bg-brand-ink p-6 shadow-2xl shadow-black/80">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="font-display text-xl font-bold text-white">{title}</h3>
          <button type="button" className="rounded-lg px-2 py-1 text-zinc-500 hover:bg-white/10 hover:text-white" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function Admin() {
  const { user } = useAuth()
  const [page, setPage] = useState({ number: 0, totalPages: 0, content: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pageIndex, setPageIndex] = useState(0)
  const [busy, setBusy] = useState(false)
  const [busyRowId, setBusyRowId] = useState(null)
  const [toast, setToast] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)

  const [cEmail, setCEmail] = useState('')
  const [cPass, setCPass] = useState('')
  const [cName, setCName] = useState('')
  const [cRole, setCRole] = useState('USER')

  const [eName, setEName] = useState('')
  const [eRole, setERole] = useState('USER')
  const [eActive, setEActive] = useState(true)
  const [eVip, setEVip] = useState('NONE')
  const [eVipUntil, setEVipUntil] = useState('')
  const [eClearVip, setEClearVip] = useState(false)
  const [eSoftDeleted, setESoftDeleted] = useState(false)
  const [includeDeletedUsers, setIncludeDeletedUsers] = useState(false)

  const load = useCallback(async (p) => {
    setLoading(true)
    setError('')
    try {
      const pg = await adminApi.adminListUsers({
        page: p,
        size: ADMIN_USER_PAGE_SIZE,
        includeDeleted: includeDeletedUsers || undefined,
      })
      setPage({
        ...pg,
        content: pg.content || [],
      })
      setPageIndex(pg.number ?? p)
    } catch (e) {
      const msg =
        e.response?.data?.message ||
        e.response?.data?.description ||
        (e.response?.status === 403 ? 'Bạn không có quyền ADMIN.' : '')
      setError(msg || String(e.response?.status || e.message || 'ERR'))
      setPage((prev) => ({ ...prev, content: [] }))
    } finally {
      setLoading(false)
    }
  }, [includeDeletedUsers])

  useEffect(() => {
    document.title = 'Quản trị — Người dùng'
  }, [])

  useEffect(() => {
    load(pageIndex).catch(() => {})
  }, [load, pageIndex])

  useEffect(() => {
    setPageIndex(0)
  }, [includeDeletedUsers])

  function openEdit(r) {
    setEditRow(r)
    setEName(r.name || '')
    setERole(r.role || 'USER')
    setEActive(r.isActive !== false)
    setEVip(r.vipTier || 'NONE')
    setEVipUntil('')
    setEClearVip(false)
    setESoftDeleted(!!r.deleted)
  }

  const patchUserSoftDelete = useCallback(
    async (r, deleted) => {
      setBusyRowId(r.id)
      setToast('')
      try {
        await adminApi.adminPatchUser(r.id, { deleted })
        setToast(deleted ? 'Đã xóa mềm tài khoản.' : 'Đã khôi phục tài khoản.')
        await load(pageIndex).catch(() => {})
      } catch (e) {
        setToast(e.response?.data?.message || e.message || 'Lỗi')
      } finally {
        setBusyRowId(null)
        window.setTimeout(() => setToast(''), 5000)
      }
    },
    [load, pageIndex]
  )

  async function submitCreate(ev) {
    ev.preventDefault()
    setBusy(true)
    setToast('')
    try {
      await adminApi.adminCreateUser({
        email: cEmail.trim(),
        password: cPass,
        name: cName.trim() || undefined,
        role: cRole === 'ADMIN' ? 'ADMIN' : 'USER',
      })
      setToast('Đã tạo người dùng.')
      setCreateOpen(false)
      setCEmail('')
      setCPass('')
      setCName('')
      setCRole('USER')
      await load(pageIndex).catch(() => {})
    } catch (e) {
      setToast(e.response?.data?.message || e.message || 'Lỗi')
    } finally {
      setBusy(false)
      window.setTimeout(() => setToast(''), 5000)
    }
  }

  async function submitEdit(ev) {
    ev.preventDefault()
    if (!editRow) return
    setBusy(true)
    setToast('')
    try {
      const body = {
        name: eName.trim(),
        role: eRole,
        isActive: eActive,
        vipTier: eVip,
      }
      if (eClearVip) body.clearVipExpiresAt = true
      if (eVipUntil.trim()) {
        body.vipExpiresAt = new Date(eVipUntil).toISOString()
      }
      if (!!editRow.deleted !== eSoftDeleted) {
        body.deleted = eSoftDeleted
      }
      await adminApi.adminPatchUser(editRow.id, body)
      setToast('Đã cập nhật.')
      setEditRow(null)
      await load(pageIndex).catch(() => {})
    } catch (e) {
      setToast(e.response?.data?.message || e.message || 'Lỗi')
    } finally {
      setBusy(false)
      window.setTimeout(() => setToast(''), 5000)
    }
  }

  const rows = page.content || []
  const th =
    'border-b border-white/[0.08] px-5 py-4 text-left text-sm font-bold uppercase tracking-wider text-zinc-500 md:px-6 md:py-5 md:text-[13px]'
  const td =
    'border-t border-white/[0.06] px-5 py-4 align-middle text-base text-zinc-200 md:px-6 md:py-5 md:text-[17px]'

  return (
    <AdminPageShell backTo="/quan-tri" title="Người dùng" subtitle={`Đăng nhập: ${user?.email ?? '—'}`}>
      <div className="mb-6 flex flex-wrap items-center gap-6">
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="rounded-xl bg-brand-coral px-6 py-3 text-base font-bold text-white shadow-lg shadow-brand-coral/25 hover:bg-rose-500"
        >
          + Thêm người dùng
        </button>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
          <input
            type="checkbox"
            className="size-4 rounded border-white/20"
            checked={includeDeletedUsers}
            onChange={(e) => setIncludeDeletedUsers(e.target.checked)}
          />
          Hiện tài khoản đã xóa mềm
        </label>
      </div>

      {toast ? (
        <p className="mb-6 rounded-xl border border-brand-coral/35 bg-brand-coral/10 px-4 py-3 text-sm text-zinc-200">{toast}</p>
      ) : null}

      {loading && !rows.length ? (
        <div className="flex min-h-[320px] items-center justify-center">
          <p className="animate-pulse text-lg text-zinc-500">Đang tải danh sách…</p>
        </div>
      ) : null}

      {error ? <p className="mb-8 rounded-2xl border border-red-500/45 bg-red-950/60 px-6 py-4 text-lg text-red-100">{error}</p> : null}

      <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-brand-panel shadow-2xl shadow-black/50">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full border-collapse">
            <thead className="bg-zinc-900/95">
              <tr>
                <th className={th}>ID</th>
                <th className={th}>Email</th>
                <th className={th}>Tên</th>
                <th className={th}>Vai trò</th>
                <th className={th}>Kích hoạt</th>
                <th className={`${th} hidden lg:table-cell`}>VIP</th>
                <th className={`${th} hidden md:table-cell`}>Trạng thái ẩn</th>
                <th className={th}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {!loading && rows.length === 0 && !error ? (
                <tr>
                  <td colSpan={8} className={`${td} py-14 text-center text-zinc-500`}>
                    Không có bản ghi.
                  </td>
                </tr>
              ) : null}
              {rows.map((r) => (
                <tr key={r.id} className="transition hover:bg-brand-coral/[0.04]">
                  <td className={`${td} text-zinc-500`}>{r.id}</td>
                  <td className={`${td} font-medium text-white`}>{r.email}</td>
                  <td className={`${td} text-zinc-400`}>{r.name ?? '—'}</td>
                  <td className={td}>
                    <span
                      className={`inline-flex rounded-full px-4 py-1.5 text-sm font-bold ${
                        r.role === 'ADMIN'
                          ? 'bg-brand-coral/20 text-brand-coral ring-1 ring-brand-coral/30'
                          : 'bg-zinc-800 text-zinc-200 ring-1 ring-zinc-600'
                      }`}
                    >
                      {r.role || 'USER'}
                    </span>
                  </td>
                  <td className={`${td} text-zinc-400`}>{r.isActive === false ? 'Không' : 'Có'}</td>
                  <td className={`${td} hidden text-zinc-500 lg:table-cell`}>{r.vipTier ?? '—'}</td>
                  <td className={`${td} hidden md:table-cell`}>
                    {r.deleted ? (
                      <span className="inline-flex rounded-full bg-red-950/70 px-3 py-1 text-xs font-semibold text-red-100 ring-1 ring-red-500/35">
                        Đã ẩn
                      </span>
                    ) : (
                      <span className="text-zinc-500">Đang dùng</span>
                    )}
                  </td>
                  <td className={td}>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(r)}
                        className="rounded-lg border border-white/15 px-3 py-1.5 text-sm font-semibold text-brand-coral hover:bg-white/5"
                      >
                        Sửa
                      </button>
                      {!r.deleted ? (
                        <button
                          type="button"
                          disabled={busyRowId === r.id || Number(user?.id) === Number(r.id)}
                          title={Number(user?.id) === Number(r.id) ? 'Không thể xóa mềm chính mình' : ''}
                          onClick={() => patchUserSoftDelete(r, true)}
                          className="rounded-lg border border-amber-500/40 bg-amber-950/40 px-3 py-1.5 text-sm font-semibold text-amber-100 hover:bg-amber-950/70 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {busyRowId === r.id ? '…' : 'Xóa mềm'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busyRowId === r.id}
                          onClick={() => patchUserSoftDelete(r, false)}
                          className="rounded-lg border border-emerald-500/45 bg-emerald-950/35 px-3 py-1.5 text-sm font-semibold text-emerald-100 hover:bg-emerald-950/55 disabled:opacity-40"
                        >
                          {busyRowId === r.id ? '…' : 'Khôi phục'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {page.totalPages > 1 ? (
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
          <button
            type="button"
            disabled={pageIndex <= 0}
            className="min-h-[52px] min-w-[132px] rounded-xl border border-white/15 px-6 text-lg font-semibold text-zinc-200 transition hover:bg-white/5 disabled:opacity-40"
            onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
          >
            ← Trước
          </button>
          <span className="text-lg text-zinc-400">
            Trang <strong className="text-white">{pageIndex + 1}</strong> / {page.totalPages}
          </span>
          <button
            type="button"
            disabled={pageIndex >= page.totalPages - 1}
            className="min-h-[52px] min-w-[132px] rounded-xl border border-white/15 px-6 text-lg font-semibold text-zinc-200 transition hover:bg-white/5 disabled:opacity-40"
            onClick={() => setPageIndex((i) => i + 1)}
          >
            Sau →
          </button>
        </div>
      ) : null}

      {createOpen ? (
        <Modal title="Thêm người dùng" onClose={() => !busy && setCreateOpen(false)}>
          <form onSubmit={submitCreate} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-zinc-500">Email</label>
              <input className={field} required type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-zinc-500">Mật khẩu</label>
              <input className={field} required type="password" minLength={6} value={cPass} onChange={(e) => setCPass(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-zinc-500">Tên hiển thị</label>
              <input className={field} value={cName} onChange={(e) => setCName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-zinc-500">Vai trò</label>
              <select className={`${field} cursor-pointer`} value={cRole} onChange={(e) => setCRole(e.target.value)}>
                {ROLE_OPTS.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-brand-coral py-3 font-bold text-white disabled:opacity-50"
            >
              {busy ? 'Đang lưu…' : 'Tạo tài khoản'}
            </button>
          </form>
        </Modal>
      ) : null}

      {editRow ? (
        <Modal title={`Sửa #${editRow.id}`} onClose={() => !busy && setEditRow(null)}>
          <form onSubmit={submitEdit} className="space-y-4">
            <p className="text-sm text-zinc-500">{editRow.email}</p>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-zinc-500">Tên hiển thị</label>
              <input className={field} value={eName} onChange={(e) => setEName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-zinc-500">Vai trò</label>
              <select className={`${field} cursor-pointer`} value={eRole} onChange={(e) => setERole(e.target.value)}>
                {ROLE_OPTS.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={eActive} onChange={(e) => setEActive(e.target.checked)} className="size-4 rounded" />
              Tài khoản đang kích hoạt
            </label>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-zinc-500">Gói VIP</label>
              <select className={`${field} cursor-pointer`} value={eVip} onChange={(e) => setEVip(e.target.value)}>
                {VIP_OPTS.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase text-zinc-500">Hết hạn VIP (tuỳ chọn)</label>
              <input
                type="datetime-local"
                className={`${field} font-mono text-sm`}
                value={eVipUntil}
                onChange={(e) => setEVipUntil(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-zinc-400">
              <input type="checkbox" checked={eClearVip} onChange={(e) => setEClearVip(e.target.checked)} className="size-4 rounded" />
              Xoá ngày hết hạn (đặt null)
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-400">
              <input type="checkbox" checked={eSoftDeleted} onChange={(e) => setESoftDeleted(e.target.checked)} className="size-4 rounded" />
              Xóa mềm (chặn đăng nhập, ẩn danh sách mặc định)
            </label>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-brand-coral py-3 font-bold text-white disabled:opacity-50"
            >
              {busy ? 'Đang lưu…' : 'Lưu thay đổi'}
            </button>
          </form>
        </Modal>
      ) : null}
    </AdminPageShell>
  )
}
