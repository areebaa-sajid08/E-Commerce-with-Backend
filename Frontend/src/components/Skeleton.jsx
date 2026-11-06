// Skeleton loaders. Each one mirrors the layout of the real content so nothing jumps when data arrives.

export const Bone = ({ className = '' }) => <div className={`skeleton ${className}`} />

function Wrap({ children, className = '', label = 'Loading' }) {
  return (
    <div className={className} role="status" aria-busy="true" aria-label={label}>
      {children}
      <span className="sr-only">{label}…</span>
    </div>
  )
}

export function ProductCardSkeleton({ offset = false }) {
  return (
    <div className={offset ? 'md:mt-16' : ''} aria-hidden="true">
      <Bone className="aspect-[3/4] w-full" />
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <Bone className="h-3 w-1/3" />
          <Bone className="h-6 w-4/5" />
        </div>
        <Bone className="h-4 w-16" />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 8, className = 'grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-4', offset = (i) => i % 2 === 1 }) {
  return (
    <Wrap className={className} label="Loading products">
      {Array.from({ length: count }).map((_, i) => <ProductCardSkeleton key={i} offset={offset(i)} />)}
    </Wrap>
  )
}

export function ProductDetailSkeleton() {
  return (
    <Wrap className="mx-auto max-w-[1400px] px-5 pt-28 md:px-10" label="Loading product">
      <Bone className="mb-8 h-4 w-48" />
      <div className="grid gap-10 md:grid-cols-[1.1fr_1fr] md:gap-20">
        <div className="flex gap-4">
          <div className="hidden flex-col gap-3 md:flex">
            {[0, 1, 2].map((i) => <Bone key={i} className="h-20 w-16" />)}
          </div>
          <Bone className="arch aspect-[3/4.2] flex-1" />
        </div>
        <div className="space-y-5">
          <Bone className="h-4 w-28" />
          <Bone className="h-14 w-4/5" />
          <Bone className="h-14 w-2/5" />
          <Bone className="h-9 w-40" />
          <div className="space-y-2 pt-2">
            <Bone className="h-4 w-full" /><Bone className="h-4 w-full" /><Bone className="h-4 w-3/5" />
          </div>
          <div className="flex gap-2 pt-4">{[0, 1, 2, 3].map((i) => <Bone key={i} className="h-10 w-14" />)}</div>
          <div className="flex gap-4 pt-4"><Bone className="h-12 w-28" /><Bone className="h-12 flex-1" /></div>
        </div>
      </div>
    </Wrap>
  )
}

export function BrandRowsSkeleton({ count = 5 }) {
  return (
    <Wrap label="Loading brands">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-6 border-t border-mist py-6 last:border-b md:gap-10">
          <Bone className="h-16 w-16 shrink-0 rounded-full md:h-24 md:w-24" />
          <div className="flex-1 space-y-3">
            <Bone className="h-9 w-2/3 md:h-14 md:w-1/2" />
            <Bone className="h-3 w-1/3" />
          </div>
          <Bone className="h-4 w-16" />
        </div>
      ))}
    </Wrap>
  )
}

export function BrandHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-8 md:flex-row md:items-end" aria-hidden="true">
      <Bone className="h-28 w-28 shrink-0 rounded-full md:h-40 md:w-40" />
      <div className="flex-1 space-y-4">
        <Bone className="h-16 w-3/4 md:h-20 md:w-1/2" />
        <Bone className="h-4 w-full max-w-xl" />
      </div>
    </div>
  )
}

export function OrderCardsSkeleton({ count = 3 }) {
  return (
    <Wrap className="space-y-8" label="Loading orders">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-mist p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2"><Bone className="h-7 w-40" /><Bone className="h-3 w-56" /></div>
            <Bone className="h-6 w-20" />
          </div>
          <div className="mt-5 divide-y divide-mist">
            {[0, 1].map((n) => (
              <div key={n} className="flex items-center gap-4 py-3">
                <Bone className="h-20 w-14" />
                <div className="flex-1 space-y-2"><Bone className="h-4 w-1/2" /><Bone className="h-3 w-1/3" /></div>
                <Bone className="h-4 w-16" />
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-end justify-between"><Bone className="h-4 w-56" /><Bone className="h-9 w-32" /></div>
        </div>
      ))}
    </Wrap>
  )
}

export function StatsSkeleton({ count = 4 }) {
  return (
    <Wrap className={`grid grid-cols-2 gap-8 ${count === 5 ? 'md:grid-cols-5' : 'md:grid-cols-4'}`} label="Loading stats">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border-t border-nida pt-4"><Bone className="h-12 w-24 md:h-14" /><Bone className="mt-3 h-3 w-28" /></div>
      ))}
    </Wrap>
  )
}

// rows with a small image on the left (dashboard product lists)
export function ListRowsSkeleton({ count = 5, image = true }) {
  return (
    <Wrap className="divide-y divide-mist border-y border-mist" label="Loading list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-5 py-4">
          {image && <Bone className="h-24 w-[4.5rem] shrink-0" />}
          <div className="flex-1 space-y-2"><Bone className="h-6 w-1/3" /><Bone className="h-3 w-1/2" /></div>
          <Bone className="hidden h-4 w-20 md:block" />
          <Bone className="h-9 w-24" />
        </div>
      ))}
    </Wrap>
  )
}

export function CartLinesSkeleton({ count = 2, compact = false }) {
  return (
    <Wrap className={compact ? 'divide-y divide-mist px-6' : 'divide-y divide-mist border-y border-mist'} label="Loading bag">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex gap-5 py-6">
          <Bone className={compact ? 'h-28 w-20 shrink-0' : 'h-40 w-28 shrink-0 md:h-48 md:w-36'} />
          <div className="flex-1 space-y-3">
            <Bone className="h-3 w-24" /><Bone className="h-7 w-3/4" /><Bone className="h-3 w-1/3" />
            <Bone className="mt-6 h-9 w-28" />
          </div>
        </div>
      ))}
    </Wrap>
  )
}
