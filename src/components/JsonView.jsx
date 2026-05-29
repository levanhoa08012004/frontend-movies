export default function JsonView({ value, className = '' }) {
  return (
    <pre
      className={`overflow-auto rounded-xl border border-zinc-800 bg-black/80 p-4 text-xs leading-relaxed text-emerald-300/90 ${className}`}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}
