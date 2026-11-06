export default function QtyStepper({ value, onChange, min = 1, max = 99, disabled }) {
  const btn = 'grid h-9 w-9 place-items-center text-lg leading-none transition-colors hover:bg-nida hover:text-chiffon disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-nida'
  return (
    <div className="inline-flex items-center border border-mist">
      <button type="button" className={btn} disabled={disabled || value <= min} onClick={() => onChange(value - 1)} aria-label="Decrease quantity">−</button>
      <span className="w-9 text-center text-sm tabular-nums" aria-live="polite">{value}</span>
      <button type="button" className={btn} disabled={disabled || value >= max} onClick={() => onChange(value + 1)} aria-label="Increase quantity">+</button>
    </div>
  )
}
