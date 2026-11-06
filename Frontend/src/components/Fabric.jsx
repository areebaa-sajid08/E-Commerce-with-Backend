import { FABRICS } from '../lib/constants'

// Stand-in for imagery: a pleated fabric swatch. `seed` picks a stable colour.
export default function Fabric({ seed = 0, className = '', children, pleat = 64 }) {
  const n = typeof seed === 'string' ? [...seed].reduce((s, c) => s + c.charCodeAt(0), 0) : seed
  return (
    <div className={`fabric ${className}`} style={{ '--fabric': FABRICS[n % FABRICS.length], '--pleat': `${pleat}px` }}>
      {children}
    </div>
  )
}
