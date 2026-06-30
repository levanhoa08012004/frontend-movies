import { useEffect, useState } from 'react'
import AdminPageShell from '../../components/AdminPageShell.jsx'
import {
  adminListCosmeticItems,
  adminCreateCosmeticItem,
  adminUpdateCosmeticItem,
  adminDeleteCosmeticItem,
  adminListTiers,
  uploadCosmeticImage,
} from '../../services/adminVipApi.js'
import { assetUrl } from '../../utils/assetUrl.js'
import AvatarFrame from '../../components/cosmetics/AvatarFrame.jsx'

const ITEM_TYPES = [
  { code: 'avatar_frame',   label: 'Khung Avatar',   icon: '🖼️' },
  { code: 'comment_frame',  label: 'Khung Bình Luận', icon: '💬' },
  { code: 'name_badge',     label: 'Badge Tên',      icon: '👑' },
  { code: 'profile_banner', label: 'Banner Profile', icon: '🌅' },
  { code: 'chat_color',     label: 'Màu Chữ Chat',   icon: '🎨' },
  { code: 'name_effect',    label: 'Hiệu Ứng Tên',   icon: '✨' },
]

const RARITIES = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY']

// Modal form input: chiều cao đồng nhất h-10 để tránh hàng cuối lệch (Tier/Rarity/SortOrder/Trạng thái).
const INPUT_CLS =
  'block w-full h-10 rounded-lg border border-white/10 bg-zinc-900/80 px-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-brand-coral/50 focus:outline-none focus:ring-1 focus:ring-brand-coral/30 disabled:opacity-50'

const EMPTY = {
  code: '',
  type: 'avatar_frame',
  name: '',
  description: '',
  previewUrl: '',
  imageUrl: '',
  cssClass: '',
  cssPayload: '',
  badgeHtml: '',
  minTierCode: 'VIP',
  isDefault: false,
  rarity: 'COMMON',
  sortOrder: 100,
  active: true,
}

export default function AdminVipItems() {
  const [activeType, setActiveType] = useState('avatar_frame')
  const [tiers, setTiers] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState('')

  async function onUploadFile(ev) {
    const file = ev.target.files?.[0]
    if (!file) return
    setErr('')
    setUploading(true)
    try {
      const res = await uploadCosmeticImage(file)
      setForm((f) => ({ ...f, imageUrl: res.url }))
    } catch (ex) {
      setErr(ex?.response?.data?.message || ex.message || 'Upload thất bại')
    } finally {
      setUploading(false)
      ev.target.value = ''
    }
  }

  async function reload() {
    setLoading(true)
    try {
      const [list, ts] = await Promise.all([
        adminListCosmeticItems(activeType),
        tiers.length ? Promise.resolve(tiers) : adminListTiers(),
      ])
      setItems(list)
      if (!tiers.length) setTiers(ts)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { reload().catch(() => {}) }, [activeType])

  function openCreate() {
    setEditing({})
    setForm({ ...EMPTY, type: activeType })
    setErr('')
  }

  function openEdit(item) {
    setEditing(item)
    setForm({
      code: item.code || '',
      type: item.type,
      name: item.name || '',
      description: item.description || '',
      previewUrl: item.previewUrl || '',
      imageUrl: item.imageUrl || '',
      cssClass: item.cssClass || '',
      cssPayload: item.cssPayload || '',
      badgeHtml: item.badgeHtml || '',
      minTierCode: item.minTierCode || 'VIP',
      isDefault: item.default ?? item.isDefault ?? false,
      rarity: item.rarity || 'COMMON',
      sortOrder: item.sortOrder ?? 0,
      active: item.active,
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
      if (editing && editing.id) {
        await adminUpdateCosmeticItem(editing.id, form)
      } else {
        await adminCreateCosmeticItem(form)
      }
      await reload()
      setEditing(null)
    } catch (ex) {
      setErr(ex?.response?.data?.message || ex.message)
    } finally {
      setBusy(false)
    }
  }

  async function remove(item) {
    if (!window.confirm(`Xoá item "${item.name}"? User đang dùng sẽ mất luôn.`)) return
    try {
      await adminDeleteCosmeticItem(item.id)
      await reload()
    } catch (ex) {
      setErr(ex?.response?.data?.message || ex.message)
    }
  }

  const typeMeta = ITEM_TYPES.find((t) => t.code === activeType) || ITEM_TYPES[0]

  return (
    <AdminPageShell
      eyebrow="Quản lý VIP"
      title="Cosmetic Items"
      subtitle="Vật phẩm trang trí cho user VIP: khung avatar, khung bình luận, badge, banner profile, màu chữ, hiệu ứng tên. User chọn 1 item per type."
      actions={
        <button onClick={openCreate}
          className="rounded-xl bg-brand-coral px-5 py-2 text-sm font-bold text-white shadow-md shadow-brand-coral/30 hover:bg-brand-accent">
          + Thêm {typeMeta.label}
        </button>
      }
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {ITEM_TYPES.map((t) => (
          <button key={t.code} onClick={() => setActiveType(t.code)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              activeType === t.code
                ? 'bg-brand-coral text-white shadow shadow-brand-coral/30'
                : 'border border-white/10 bg-white/[0.04] text-zinc-300 hover:border-brand-coral/40'
            }`}>
            <span className="mr-1">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {err && (
        <p className="mb-4 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">{err}</p>
      )}

      {loading ? (
        <p className="text-zinc-500">Đang tải…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((it) => (
            <div key={it.id} className={`relative rounded-2xl border bg-white/[0.02] p-4 transition ${
              it.active ? 'border-white/10 hover:border-brand-coral/40' : 'border-white/5 opacity-60'
            }`}>
              <div className="aspect-[16/9] overflow-hidden rounded-xl bg-zinc-900">
                {it.previewUrl ? (
                  <img src={it.previewUrl} alt={it.name} className="h-full w-full object-cover" />
                ) : (
                  <PreviewBox item={it} />
                )}
              </div>
              <div className="mt-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-white">{it.name}</p>
                  <p className="truncate font-mono text-[10px] text-zinc-500">{it.code}</p>
                </div>
                <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase ${rarityCls(it.rarity)}`}>
                  {it.rarity}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-zinc-400">
                <span className="rounded bg-white/5 px-1.5 py-0.5">Tier ≥ {it.minTierCode}</span>
                {it.default || it.isDefault ? (
                  <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-emerald-300">Mặc định</span>
                ) : null}
              </div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => openEdit(it)} className="flex-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-200 hover:border-brand-coral/40">Sửa</button>
                <button onClick={() => remove(it)} className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/10">Xoá</button>
              </div>
            </div>
          ))}
          {!items.length && (
            <p className="col-span-full text-center text-zinc-500">Chưa có item nào trong nhóm này.</p>
          )}
        </div>
      )}

      {editing !== null && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 px-4 py-10 backdrop-blur-sm"
          onClick={close}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={save}
            className="w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl"
          >
            <header className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                  {typeMeta.icon} {typeMeta.label}
                </p>
                <h3 className="font-display mt-1 text-xl font-bold text-white">
                  {editing.id ? `Sửa: ${editing.name}` : `Thêm ${typeMeta.label}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={close}
                disabled={busy}
                className="rounded-lg px-2 py-1 text-zinc-500 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
                aria-label="Đóng"
              >
                ✕
              </button>
            </header>

            <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
              <Field label="Code (unique)">
                <input
                  value={form.code}
                  disabled={!!editing.id}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase().replace(/\s/g, '-') })}
                  required
                  maxLength={64}
                  className={`${INPUT_CLS} font-mono text-sm`}
                  placeholder="frame-neon-pink"
                />
              </Field>
              <Field label="Loại">
                <select
                  value={form.type}
                  disabled={!!editing.id}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className={INPUT_CLS}
                >
                  {ITEM_TYPES.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Tên hiển thị" full>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className={INPUT_CLS}
                  placeholder="Khung Neon Hồng"
                />
              </Field>
              <Field label="Mô tả" full>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className={`${INPUT_CLS} h-auto py-2.5`}
                />
              </Field>
              <Field label="Ảnh frame (PNG/JPG/WebP — overlay khi user equip)" full>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-brand-coral/40 bg-brand-coral/10 px-4 text-xs font-bold text-brand-coral transition hover:bg-brand-coral/20">
                      <input type="file" accept="image/*" onChange={onUploadFile} disabled={uploading} className="hidden" />
                      {uploading ? '⏳ Đang upload…' : '📤 Tải ảnh lên server'}
                    </label>
                    {form.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, imageUrl: '' })}
                        className="h-10 rounded-lg border border-white/15 px-3 text-xs text-zinc-300 hover:bg-white/5"
                      >
                        Xoá ảnh
                      </button>
                    )}
                  </div>
                  <input
                    value={form.imageUrl}
                    onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                    className={`${INPUT_CLS} font-mono text-xs`}
                    placeholder="Hoặc dán URL trực tiếp: https://..."
                  />
                  {form.imageUrl && (
                    <div className="rounded-xl border border-white/10 bg-zinc-900 p-3">
                      <p className="mb-2 text-[10px] uppercase tracking-wide text-zinc-500">Preview (như khi user equip)</p>
                      <div className="grid min-h-[140px] place-items-center rounded-lg bg-gradient-to-br from-zinc-800 to-black p-4">
                        <AvatarFrame
                          frame={{ imageUrl: form.imageUrl, cssClass: form.cssClass }}
                          size={64}
                        >
                          <span className="text-2xl font-bold text-white">A</span>
                        </AvatarFrame>
                      </div>
                    </div>
                  )}
                </div>
                <p className="mt-2 text-[11px] text-zinc-500">Khuyên dùng PNG nền trong suốt ≥ 256×256, file ≤ 5MB.</p>
              </Field>
              <Field label="CSS class predefined (fallback)">
                <input
                  value={form.cssClass}
                  onChange={(e) => setForm({ ...form, cssClass: e.target.value })}
                  className={`${INPUT_CLS} font-mono text-sm`}
                  placeholder="frame-neon-pink"
                />
              </Field>
              <Field label="Badge HTML (cho name_badge)">
                <input
                  value={form.badgeHtml}
                  onChange={(e) => setForm({ ...form, badgeHtml: e.target.value })}
                  className={INPUT_CLS}
                  placeholder="👑 hoặc 💎"
                />
              </Field>
              <Field label="Preview URL (thumbnail list admin)" full>
                <input
                  value={form.previewUrl}
                  onChange={(e) => setForm({ ...form, previewUrl: e.target.value })}
                  className={INPUT_CLS}
                  placeholder="https://... (không bắt buộc)"
                />
              </Field>
              <Field label="CSS payload tuỳ chỉnh (advanced)" full>
                <textarea
                  value={form.cssPayload}
                  onChange={(e) => setForm({ ...form, cssPayload: e.target.value })}
                  rows={3}
                  className={`${INPUT_CLS} h-auto py-2.5 font-mono text-xs`}
                  placeholder=".frame-custom { border: 2px solid #f43f5e; box-shadow: 0 0 12px rgba(244,63,94,0.5); }"
                />
              </Field>
              <Field label="Tier tối thiểu">
                <select
                  value={form.minTierCode}
                  onChange={(e) => setForm({ ...form, minTierCode: e.target.value })}
                  className={INPUT_CLS}
                >
                  {tiers.map((t) => (
                    <option key={t.code} value={t.code}>
                      {t.displayName} ({t.code})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Độ hiếm">
                <select
                  value={form.rarity}
                  onChange={(e) => setForm({ ...form, rarity: e.target.value })}
                  className={INPUT_CLS}
                >
                  {RARITIES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Thứ tự sắp xếp">
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                  className={INPUT_CLS}
                />
              </Field>
              <Field label="Trạng thái">
                <div className={`flex h-10 items-center gap-5 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-sm`}>
                  <label className="flex cursor-pointer items-center gap-2 text-zinc-200">
                    <input
                      type="checkbox"
                      checked={form.isDefault}
                      onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                      className="size-4 rounded"
                    />
                    Mặc định
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-zinc-200">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) => setForm({ ...form, active: e.target.checked })}
                      className="size-4 rounded"
                    />
                    Active
                  </label>
                </div>
              </Field>
            </div>

            {err && (
              <p className="mt-5 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-200">{err}</p>
            )}

            <div className="mt-6 flex justify-end gap-3 border-t border-white/[0.06] pt-5">
              <button
                type="button"
                onClick={close}
                disabled={busy}
                className="rounded-xl border border-white/15 px-5 py-2 text-sm font-semibold text-zinc-200 hover:bg-white/5 disabled:opacity-50"
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-xl bg-brand-coral px-5 py-2 text-sm font-bold text-white shadow-md shadow-brand-coral/30 hover:bg-brand-accent disabled:opacity-50"
              >
                {busy ? 'Đang lưu…' : 'Lưu'}
              </button>
            </div>
          </form>
        </div>
      )}
    </AdminPageShell>
  )
}

function rarityCls(r) {
  if (r === 'LEGENDARY') return 'bg-gradient-to-r from-amber-500 to-rose-500 text-white'
  if (r === 'EPIC')      return 'bg-purple-500/30 text-purple-200'
  if (r === 'RARE')      return 'bg-blue-500/25 text-blue-200'
  return 'bg-zinc-500/25 text-zinc-200'
}

function PreviewBox({ item }) {
  if (item.type === 'avatar_frame') {
    // Dùng đúng component AvatarFrame của user-facing UI để admin thấy
    // chính xác user sẽ nhận được gì khi equip (scale container, blend mode,
    // drop-shadow… đều khớp). Tránh duplicate logic dễ lệch.
    return (
      <div className="flex h-full items-center justify-center p-3">
        <AvatarFrame
          frame={{ imageUrl: item.imageUrl, cssClass: item.cssClass }}
          size={56}
        >
          <span className="text-xl font-bold text-white">A</span>
        </AvatarFrame>
      </div>
    )
  }
  if (item.type === 'comment_frame') {
    return (
      <div className={`m-3 rounded-lg p-3 text-xs text-zinc-200 ${item.cssClass || 'border border-white/10'}`}>
        Demo bình luận VIP
      </div>
    )
  }
  if (item.type === 'name_badge') {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-lg text-white">
        VIPuser <span>{item.badgeHtml}</span>
      </div>
    )
  }
  if (item.type === 'profile_banner') {
    if (item.imageUrl) {
      return <div className="h-full w-full" style={{ backgroundImage: `url("${item.imageUrl}")`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
    }
    return <div className={`h-full w-full ${item.cssClass || 'bg-gradient-to-br from-zinc-800 to-black'}`} />
  }
  if (item.type === 'chat_color') {
    return (
      <div className="flex h-full items-center justify-center">
        <span className={`text-sm ${item.cssClass || ''}`}>Bình luận với màu này</span>
      </div>
    )
  }
  if (item.type === 'name_effect') {
    return (
      <div className="flex h-full items-center justify-center">
        <span className={`text-lg font-bold text-white ${item.cssClass || ''}`}>Tên hiệu ứng</span>
      </div>
    )
  }
  return <div className="grid h-full place-items-center text-xs text-zinc-500">{item.type}</div>
}

function Field({ label, children, full }) {
  return (
    <div className={full ? 'sm:col-span-2' : ''}>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{label}</label>
      {children}
    </div>
  )
}
