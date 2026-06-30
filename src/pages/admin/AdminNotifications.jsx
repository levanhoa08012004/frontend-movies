import { useEffect, useMemo, useState } from 'react'
import AdminPageShell from '../../components/AdminPageShell.jsx'
import {
  adminListCategories,
  adminToggleCategory,
  adminListTemplates,
  adminCreateTemplate,
  adminUpdateTemplate,
  adminDeleteTemplate,
  adminSendTemplate,
} from '../../services/notificationApi.js'

const TIERS = [
  { value: 'ALL', label: 'Tất cả user' },
  { value: 'NONE', label: 'User thường (chưa VIP)' },
  { value: 'VIP', label: 'Gói VIP' },
  { value: 'VIPPRO', label: 'Gói VIPPRO' },
  { value: 'PRIME', label: 'Gói PRIME' },
]

const TRIGGER_BADGE = {
  WIRED: { label: 'Auto', cls: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-400' },
  TRIGGER_NEEDED: { label: 'Cần wire', cls: 'border-amber-400/30 bg-amber-500/10 text-amber-400' },
  MANUAL_ONLY: { label: 'Gửi tay', cls: 'border-sky-400/30 bg-sky-500/10 text-sky-400' },
}

const EMPTY_TEMPLATE = {
  id: null,
  categoryKey: '',
  title: '',
  body: '',
  targetTier: 'ALL',
  linkUrl: '',
  active: true,
}

export default function AdminNotifications() {
  const [tab, setTab] = useState('templates') // 'templates' | 'categories'
  const [categories, setCategories] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_TEMPLATE)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [toast, setToast] = useState('')

  async function reload() {
    setLoading(true)
    try {
      const [cats, tpls] = await Promise.all([adminListCategories(), adminListTemplates()])
      setCategories(cats)
      setTemplates(tpls)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    reload().catch(() => {})
  }, [])

  function flashToast(msg) {
    setToast(msg)
    window.setTimeout(() => setToast(''), 3000)
  }

  // Category-keyed map cho lookup nhanh
  const categoryByKey = useMemo(() => {
    const m = {}
    for (const c of categories) m[c.eventKey] = c
    return m
  }, [categories])

  const enabledCategories = categories.filter((c) => c.enabled)

  // ===== Category handlers =====
  async function toggleCategoryEnabled(c) {
    try {
      await adminToggleCategory(c.eventKey, !c.enabled)
      await reload()
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Lỗi toggle')
    }
  }

  // ===== Template handlers =====
  function openCreate() {
    setEditing({})
    setForm({ ...EMPTY_TEMPLATE })
    setErr('')
  }

  function openEdit(t) {
    setEditing(t)
    setForm({
      id: t.id,
      categoryKey: t.categoryKey,
      title: t.title || '',
      body: t.body || '',
      targetTier: t.targetTier || 'ALL',
      linkUrl: t.linkUrl || '',
      active: t.active !== false,
    })
    setErr('')
  }

  function closeEditor() {
    if (busy) return
    setEditing(null)
    setForm(EMPTY_TEMPLATE)
  }

  async function saveTemplate(opts = { sendAfter: false }) {
    setBusy(true)
    setErr('')
    try {
      const payload = {
        title: form.title,
        body: form.body,
        targetTier: form.targetTier,
        linkUrl: form.linkUrl || null,
        active: form.active,
      }
      let savedId = form.id
      if (form.id) {
        await adminUpdateTemplate(form.id, payload)
      } else {
        if (!form.categoryKey) {
          setErr('Chọn loại thông báo')
          setBusy(false)
          return
        }
        const created = await adminCreateTemplate({ ...payload, categoryKey: form.categoryKey })
        savedId = created?.id
      }
      if (opts.sendAfter && savedId) {
        const r = await adminSendTemplate(savedId)
        flashToast(`✓ Đã gửi tới ${r?.sentCount ?? 0} user`)
      } else {
        flashToast(form.id ? '✓ Đã cập nhật template' : '✓ Đã tạo template')
      }
      await reload()
      setEditing(null)
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || 'Lỗi lưu')
    } finally {
      setBusy(false)
    }
  }

  async function deleteTemplate(t) {
    if (!confirm(`Xoá template "${t.title}"?\n\nLưu ý: tất cả thông báo đã gửi cho user từ template này sẽ biến mất khỏi inbox.`)) return
    try {
      await adminDeleteTemplate(t.id)
      flashToast('✓ Đã xoá')
      await reload()
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Lỗi xoá')
    }
  }

  async function sendTemplate(t) {
    if (!t.active) {
      alert('Template đang tắt — bật trước khi gửi.')
      return
    }
    if (!confirm(`Gửi template "${t.title}" tới user khớp ${t.targetTier}?`)) return
    try {
      const r = await adminSendTemplate(t.id)
      flashToast(`✓ Đã gửi tới ${r?.sentCount ?? 0} user`)
      await reload()
    } catch (e) {
      alert(e?.response?.data?.message || e.message || 'Lỗi gửi')
    }
  }

  return (
    <AdminPageShell
      eyebrow="Quản trị thông báo"
      title="Trung tâm thông báo"
      subtitle="Loại thông báo set cứng — admin tạo thông báo (title/body/đối tượng) gắn vào từng loại."
      backTo="/quan-tri"
      actions={
        tab === 'templates' ? (
          <button
            type="button"
            onClick={openCreate}
            className="rounded-full bg-brand-coral px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-rose-600"
          >
            + Tạo thông báo mới
          </button>
        ) : null
      }
    >
      {toast ? (
        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-300">
          {toast}
        </div>
      ) : null}

      <div className="mb-8 flex gap-2 rounded-full border border-white/10 bg-black/30 p-1 sm:w-fit">
        <button
          type="button"
          onClick={() => setTab('templates')}
          className={`flex-1 rounded-full px-5 py-2 text-sm font-semibold transition sm:flex-initial ${
            tab === 'templates' ? 'bg-brand-coral text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Thông báo ({templates.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('categories')}
          className={`flex-1 rounded-full px-5 py-2 text-sm font-semibold transition sm:flex-initial ${
            tab === 'categories' ? 'bg-brand-coral text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Loại thông báo ({categories.length})
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((k) => (
            <div key={k} className="h-20 animate-pulse rounded-xl bg-zinc-900/50" />
          ))}
        </div>
      ) : tab === 'templates' ? (
        <TemplatesList
          templates={templates}
          categoryByKey={categoryByKey}
          onEdit={openEdit}
          onDelete={deleteTemplate}
          onSend={sendTemplate}
        />
      ) : (
        <CategoriesList categories={categories} onToggle={toggleCategoryEnabled} />
      )}

      {editing ? (
        <TemplateEditorModal
          form={form}
          setForm={setForm}
          enabledCategories={enabledCategories}
          categoryByKey={categoryByKey}
          isUpdate={!!form.id}
          err={err}
          busy={busy}
          onClose={closeEditor}
          onSave={() => saveTemplate({ sendAfter: false })}
          onSaveAndSend={() => saveTemplate({ sendAfter: true })}
        />
      ) : null}
    </AdminPageShell>
  )
}

function CategoriesList({ categories, onToggle }) {
  if (categories.length === 0) {
    return <p className="text-center text-zinc-500 py-12">Chưa có loại nào.</p>
  }
  // Group by trigger flag
  const groups = { WIRED: [], TRIGGER_NEEDED: [], MANUAL_ONLY: [] }
  for (const c of categories) {
    const key = c.hasBackendTrigger || 'MANUAL_ONLY'
    groups[key] = groups[key] || []
    groups[key].push(c)
  }
  const groupLabels = {
    WIRED: 'Auto (backend đã wire trigger)',
    TRIGGER_NEEDED: 'Cần wire trigger (chưa có code fire — gửi tay được)',
    MANUAL_ONLY: 'Gửi tay (không có auto trigger)',
  }
  return (
    <div className="space-y-8">
      {Object.entries(groups).map(([k, items]) => (items?.length ? (
        <section key={k}>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">
            {groupLabels[k]} — {items.length}
          </h3>
          <div className="space-y-2">
            {items.map((c) => (
              <CategoryRow key={c.eventKey} cat={c} onToggle={() => onToggle(c)} />
            ))}
          </div>
        </section>
      ) : null))}
    </div>
  )
}

function CategoryRow({ cat, onToggle }) {
  const badge = TRIGGER_BADGE[cat.hasBackendTrigger] || TRIGGER_BADGE.MANUAL_ONLY
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-white/[0.06] bg-brand-panel p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-display text-base font-bold text-white">{cat.name}</h4>
          <code className="rounded bg-zinc-900 px-1.5 py-0.5 text-[11px] text-zinc-400">{cat.eventKey}</code>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.cls}`}>
            {badge.label}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              cat.enabled ? 'bg-emerald-500/15 text-emerald-400' : 'bg-zinc-700/40 text-zinc-500'
            }`}
          >
            {cat.enabled ? 'Đang bật' : 'Đã tắt'}
          </span>
        </div>
        {cat.description ? (
          <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{cat.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onToggle}
        className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
          cat.enabled
            ? 'border-zinc-700 text-zinc-300 hover:bg-zinc-800'
            : 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'
        }`}
      >
        {cat.enabled ? 'Tắt' : 'Bật'}
      </button>
    </div>
  )
}

function TemplatesList({ templates, categoryByKey, onEdit, onDelete, onSend }) {
  if (templates.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/15 bg-black/30 px-8 py-16 text-center">
        <p className="font-display text-lg text-zinc-300">Chưa có thông báo nào</p>
        <p className="mt-2 text-sm text-zinc-600">
          Bấm "+ Tạo thông báo mới" ở góc trên phải để tạo template đầu tiên. Cron sẽ dùng template này khi loại tương ứng fire.
        </p>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {templates.map((t) => {
        const cat = categoryByKey[t.categoryKey]
        const triggerBadge = TRIGGER_BADGE[t.hasBackendTrigger] || TRIGGER_BADGE.MANUAL_ONLY
        return (
          <div key={t.id} className="rounded-2xl border border-white/[0.06] bg-brand-panel p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-display text-lg font-bold text-white">{t.title}</h4>
                  {!t.active ? (
                    <span className="rounded-full bg-zinc-700/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                      Tắt
                    </span>
                  ) : null}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-brand-coral/15 px-2 py-0.5 text-[11px] font-semibold text-brand-coral">
                    📌 {cat?.name || t.categoryName || t.categoryKey}
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${triggerBadge.cls}`}>
                    {triggerBadge.label}
                  </span>
                  <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[11px] text-zinc-300">
                    👥 {TIERS.find((x) => x.value === t.targetTier)?.label || t.targetTier}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400 line-clamp-3">{t.body}</p>
                {t.linkUrl ? (
                  <p className="mt-2 text-xs text-zinc-600">🔗 {t.linkUrl}</p>
                ) : null}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => onSend(t)}
                  className="rounded-lg border border-brand-coral/40 px-3 py-1.5 text-xs font-semibold text-brand-coral hover:bg-brand-coral/10"
                >
                  Gửi
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(t)}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/5"
                >
                  Sửa
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(t)}
                  className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/10"
                >
                  Xoá
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TemplateEditorModal({ form, setForm, enabledCategories, categoryByKey, isUpdate, err, busy, onClose, onSave, onSaveAndSend }) {
  const selectedCat = categoryByKey[form.categoryKey]
  // Manual-only / wired-broadcast → có thể "Gửi ngay" sau khi tạo
  const canSendNow = selectedCat && (selectedCat.hasBackendTrigger === 'MANUAL_ONLY' || selectedCat.eventKey === 'BROADCAST')

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <form
        onSubmit={(e) => { e.preventDefault(); onSave() }}
        className="w-full max-w-[640px] overflow-hidden rounded-2xl border border-white/10 bg-brand-panel shadow-2xl"
      >
        <div className="border-b border-white/10 px-6 py-4">
          <h2 className="font-display text-xl font-bold text-white">
            {isUpdate ? 'Sửa thông báo' : 'Tạo thông báo mới'}
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Title/body hỗ trợ placeholder {'{{key}}'} — cron tự thay khi fire (vd {'{{tier}}'}, {'{{title}}'}, {'{{daysLeft}}'}).
          </p>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          <div className="grid gap-4">
            <Field label="Loại thông báo" required>
              {isUpdate ? (
                <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-300">
                  {selectedCat?.name || form.categoryKey}{' '}
                  <span className="text-xs text-zinc-600">({form.categoryKey})</span>
                </div>
              ) : (
                <select
                  required
                  value={form.categoryKey}
                  onChange={(e) => setForm({ ...form, categoryKey: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-brand-coral"
                >
                  <option value="">— Chọn loại —</option>
                  {enabledCategories.map((c) => (
                    <option key={c.eventKey} value={c.eventKey}>
                      {c.name} ({c.eventKey})
                    </option>
                  ))}
                </select>
              )}
              {selectedCat?.description ? (
                <p className="mt-1.5 text-[11px] text-zinc-500">💡 {selectedCat.description}</p>
              ) : null}
            </Field>

            <Field label="Tiêu đề" required>
              <input
                required
                type="text"
                maxLength={255}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="vd: 🎬 Phim mới: {{title}}"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-brand-coral"
              />
            </Field>

            <Field label="Nội dung" required>
              <textarea
                required
                rows={5}
                maxLength={4000}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="vd: {{title}} vừa lên VieStream — khám phá ngay!"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-brand-coral"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Đối tượng" required>
                <select
                  value={form.targetTier}
                  onChange={(e) => setForm({ ...form, targetTier: e.target.value })}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-brand-coral"
                >
                  {TIERS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Trạng thái">
                <label className="mt-1 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm({ ...form, active: e.target.checked })}
                    className="accent-brand-coral"
                  />
                  Bật (cron sẽ dùng)
                </label>
              </Field>
            </div>

            <Field label="Link mở khi click (tuỳ chọn)">
              <input
                type="text"
                value={form.linkUrl}
                onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
                placeholder="/vip hoặc /phim/123 hoặc https://..."
                maxLength={500}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-brand-coral"
              />
            </Field>
          </div>

          {err ? <p className="mt-4 rounded-lg bg-red-500/15 px-3 py-2 text-sm text-red-400">{err}</p> : null}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 bg-black/20 px-6 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-zinc-900"
          >
            Huỷ
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-zinc-700 px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-600 disabled:opacity-50"
          >
            {busy ? 'Đang lưu…' : 'Lưu'}
          </button>
          {canSendNow ? (
            <button
              type="button"
              onClick={onSaveAndSend}
              disabled={busy}
              className="rounded-lg bg-brand-coral px-5 py-2 text-sm font-semibold text-white hover:bg-rose-600 disabled:opacity-50"
            >
              {busy ? 'Đang lưu…' : 'Lưu & Gửi ngay'}
            </button>
          ) : null}
        </div>
      </form>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {label}
        {required ? <span className="ml-1 text-brand-coral">*</span> : null}
      </span>
      {children}
    </label>
  )
}
