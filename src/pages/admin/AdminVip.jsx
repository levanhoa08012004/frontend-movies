import { useEffect, useMemo, useState } from 'react'
import AdminPageShell from '../../components/AdminPageShell.jsx'
import {
  adminListTiers,
  adminListPlans,
  adminCreatePlan,
  adminUpdatePlan,
  adminListBenefitCodes,
  adminListBenefitsForTier,
  adminReplaceBenefitsForTier,
  adminListBenefitDefs,
} from '../../services/adminVipApi'

const BILLING_PERIODS = ['MONTH', 'QUARTER', 'YEAR']

export default function AdminVip() {
  const [tiers, setTiers] = useState([])
  const [plans, setPlans] = useState([])
  const [benefitCodes, setBenefitCodes] = useState([])
  const [benefitDefs, setBenefitDefs] = useState([])
  const [activeTier, setActiveTier] = useState(null)
  const [benefitsMap, setBenefitsMap] = useState({}) // benefit_code → {valueInt|valueBool|valueText}
  const [planModal, setPlanModal] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Map benefit_code → display metadata (icon, name, description) để render trong matrix.
  const defByCode = useMemo(() => {
    const m = {}
    for (const d of benefitDefs) m[d.code] = d
    return m
  }, [benefitDefs])

  const reload = async () => {
    try {
      const [ts, ps, bcs, bds] = await Promise.all([
        adminListTiers(),
        adminListPlans(),
        adminListBenefitCodes(),
        adminListBenefitDefs().catch(() => []),
      ])
      setTiers(ts)
      setPlans(ps)
      setBenefitCodes(bcs)
      setBenefitDefs(bds)
      if (!activeTier && ts.length) setActiveTier(ts[0].code)
    } catch (e) {
      setError(e?.message || 'Lỗi tải')
    }
  }
  useEffect(() => { reload() }, [])

  useEffect(() => {
    if (!activeTier) return
    adminListBenefitsForTier(activeTier)
      .then((rs) => {
        const m = {}
        rs.forEach((r) => {
          m[r.benefitCode] = { valueInt: r.valueInt, valueBool: r.valueBool, valueText: r.valueText }
        })
        setBenefitsMap(m)
      })
      .catch(() => setBenefitsMap({}))
  }, [activeTier])

  const saveBenefits = async () => {
    setSaving(true)
    setError('')
    try {
      const entries = benefitCodes.map((bc) => ({
        benefitCode: bc.code,
        valueInt: bc.type === 'INT' ? (benefitsMap[bc.code]?.valueInt ?? null) : null,
        valueBool: bc.type === 'BOOL' ? (benefitsMap[bc.code]?.valueBool ?? null) : null,
        valueText: bc.type === 'TEXT' ? (benefitsMap[bc.code]?.valueText ?? null) : null,
      })).filter((e) => e.valueInt !== null || e.valueBool !== null || (e.valueText && e.valueText.trim() !== ''))
      await adminReplaceBenefitsForTier(activeTier, { benefits: entries })
      alert('Đã lưu matrix benefits')
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Lỗi lưu')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminPageShell eyebrow="Quản trị" title="Quản lý VIP">
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}


      {/* PLANS */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Gói (giá + chu kỳ)</h2>
        </div>
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-900 text-left text-zinc-400">
              <tr>
                <th className="px-3 py-2">Tier</th>
                <th className="px-3 py-2">Giá (VND)</th>
                <th className="px-3 py-2">Chu kỳ</th>
                <th className="px-3 py-2">Summary</th>
                <th className="px-3 py-2">Active</th>
                <th className="px-3 py-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id} className="border-t border-zinc-800">
                  <td className="px-3 py-2 font-mono text-zinc-200">{p.tierCode}</td>
                  <td className="px-3 py-2 text-zinc-200">{p.priceVnd?.toLocaleString()}</td>
                  <td className="px-3 py-2 text-zinc-400">{p.billingPeriod}</td>
                  <td className="px-3 py-2 max-w-md truncate text-zinc-400" title={p.summary}>{p.summary}</td>
                  <td className="px-3 py-2">{p.active ? '✓' : '—'}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      <ActionButton variant="primary" onClick={() => setPlanModal(p)}>
                        ✎ Sửa
                      </ActionButton>
                      {p.active ? (
                        <ActionButton
                          variant="warning"
                          onClick={async () => {
                            await adminUpdatePlan(p.id, { active: false })
                            reload()
                          }}
                        >
                          ⊘ Ẩn
                        </ActionButton>
                      ) : (
                        <ActionButton
                          variant="success"
                          onClick={async () => {
                            await adminUpdatePlan(p.id, { active: true })
                            reload()
                          }}
                        >
                          ✓ Bật lại
                        </ActionButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* BENEFITS MATRIX */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-white">Benefits Matrix</h2>
        <div className="mb-3 flex items-center gap-3">
          <label className="text-sm text-zinc-400">Tier:</label>
          <select
            value={activeTier || ''}
            onChange={(e) => setActiveTier(e.target.value)}
            className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white"
          >
            {tiers.map((t) => (
              <option key={t.code} value={t.code}>{t.displayName} ({t.code})</option>
            ))}
          </select>
        </div>

        <div className="divide-y divide-white/[0.04] rounded-2xl border border-white/[0.08] bg-zinc-950">
          {benefitCodes.map((bc) => (
            <BenefitRow
              key={bc.code}
              code={bc.code}
              type={bc.type}
              def={defByCode[bc.code]}
              value={benefitsMap[bc.code]}
              onChange={(v) => setBenefitsMap({ ...benefitsMap, [bc.code]: v })}
            />
          ))}
          {benefitCodes.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-zinc-500">
              Chưa có benefit nào — vào "Đặc quyền VIP" để tạo.
            </p>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={saveBenefits}
            disabled={saving}
            className="rounded-md bg-brand-coral px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Đang lưu…' : '💾 Lưu matrix'}
          </button>
        </div>
      </section>

      {planModal && (
        <PlanModal
          initial={planModal === 'new' ? null : planModal}
          tiers={tiers}
          onClose={() => setPlanModal(null)}
          onSaved={() => { setPlanModal(null); reload() }}
        />
      )}
    </AdminPageShell>
  )
}

function BenefitRow({ code, type, def, value, onChange }) {
  const icon = def?.icon || '·'
  const displayName = def?.displayName || code
  const desc = def?.description
  return (
    <div className="flex flex-wrap items-center gap-4 px-4 py-3 transition hover:bg-white/[0.02]">
      <div className="flex w-72 min-w-0 items-center gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.04] text-base">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white" title={desc || displayName}>
            {displayName}
          </p>
          <p className="truncate font-mono text-[10px] text-zinc-500">{code}</p>
        </div>
      </div>
      <span className="rounded bg-zinc-900 px-2 py-0.5 text-[10px] font-bold text-zinc-400 ring-1 ring-white/5">
        {type}
      </span>
      <div className="ml-auto flex-shrink-0">
        {type === 'INT' && (
          <input
            type="number"
            value={value?.valueInt ?? ''}
            onChange={(e) => onChange({ valueInt: e.target.value === '' ? null : Number(e.target.value) })}
            className="w-32 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-white"
            placeholder="(trống)"
          />
        )}
        {type === 'BOOL' && (
          <label className="flex h-9 items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={!!value?.valueBool}
              onChange={(e) => onChange({ valueBool: e.target.checked })}
              className="size-4"
            />
            {value?.valueBool ? 'Bật' : 'Tắt'}
          </label>
        )}
        {type === 'TEXT' && (
          <input
            type="text"
            value={value?.valueText ?? ''}
            onChange={(e) => onChange({ valueText: e.target.value })}
            className="w-48 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-white"
            placeholder="(trống)"
          />
        )}
      </div>
    </div>
  )
}

function PlanModal({ initial, tiers, onClose, onSaved }) {
  const [form, setForm] = useState({
    tierCode: initial?.tierCode || tiers[0]?.code || '',
    priceVnd: initial?.priceVnd || 0,
    summary: initial?.summary || '',
    billingPeriod: initial?.billingPeriod || 'MONTH',
    active: initial?.active ?? true,
  })
  const [err, setErr] = useState('')
  const save = async () => {
    try {
      const body = {
        tierCode: form.tierCode,
        priceVnd: Number(form.priceVnd),
        summary: form.summary,
        billingPeriod: form.billingPeriod,
        active: form.active,
      }
      if (initial) await adminUpdatePlan(initial.id, body)
      else await adminCreatePlan(body)
      onSaved()
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || 'Lỗi lưu')
    }
  }
  return (
    <Modal title={initial ? `Sửa gói ${initial.tierCode}` : 'Thêm gói mới'} onClose={onClose}>
      <div className="grid gap-3">
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Tier</label>
          <div className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 font-mono text-sm text-zinc-300">
            {form.tierCode}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-400">Chu kỳ</label>
          <div className="w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 font-mono text-sm text-zinc-300">
            {form.billingPeriod}
          </div>
        </div>
        <Field label="Giá (VND)" type="number" value={form.priceVnd} onChange={(v) => setForm({ ...form, priceVnd: v })} />
        <Field label="Summary" value={form.summary} onChange={(v) => setForm({ ...form, summary: v })} />
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
          Active
        </label>
        {err && <p className="text-sm text-red-400">{err}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="rounded-md border border-zinc-700 px-4 py-2 text-sm text-zinc-200">Huỷ</button>
          <button onClick={save} className="rounded-md bg-brand-coral px-4 py-2 text-sm font-semibold text-white">Lưu</button>
        </div>
      </div>
    </Modal>
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
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition ${styles[variant] || styles.primary}`}
    >
      {children}
    </button>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-zinc-400">{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
      />
    </div>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/75 px-4 py-10 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 shadow-2xl"
      >
        <h3 className="mb-5 text-lg font-semibold text-white">{title}</h3>
        {children}
      </div>
    </div>
  )
}
