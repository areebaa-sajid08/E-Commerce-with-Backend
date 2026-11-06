export default function Stars({ value = 0, count, size = 14 }) {
  return (
    <span className="inline-flex items-center gap-2" aria-label={`Rated ${value} out of 5`}>
      <span className="relative inline-block leading-none text-mist" style={{ fontSize: size, letterSpacing: 2 }}>
        ★★★★★
        <span className="absolute inset-y-0 left-0 overflow-hidden text-thread" style={{ width: `${(value / 5) * 100}%` }}>
          ★★★★★
        </span>
      </span>
      {count !== undefined && <span className="text-xs text-nida-soft">({count})</span>}
    </span>
  )
}
