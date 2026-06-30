import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  widthClass = 'max-w-lg',
}) {
  useEffect(() => {
    if (!isOpen) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const node = (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto px-4 py-8 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
      <div
        className={`relative w-full ${widthClass} rounded-2xl border border-white/10 bg-brand-panel shadow-2xl shadow-black/60`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-6 py-4">
          {title ? (
            <h2 id="modal-title" className="font-display text-lg font-bold text-white">
              {title}
            </h2>
          ) : (
            <span />
          )}
          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full text-zinc-400 transition hover:bg-white/10 hover:text-white"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )

  return createPortal(node, document.body)
}
