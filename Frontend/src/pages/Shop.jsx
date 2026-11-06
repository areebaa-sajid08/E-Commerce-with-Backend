import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { gsap, ScrollTrigger, useGSAP, parallaxAll } from '../lib/gsap'
import { productApi, brandApi } from '../lib/api'
import { CATEGORIES } from '../lib/constants'
import { brandName } from '../lib/format'
import { useSocketEvent, useRefetchOn } from '../lib/useSocket'
import ProductCard from '../components/ProductCard'
import { Empty, PageHead } from '../components/States'
import { ProductGridSkeleton } from '../components/Skeleton'

const SORTS = [
  ['newest', 'Newest'], ['price-asc', 'Price: low to high'], ['price-desc', 'Price: high to low'], ['rating', 'Best rated'],
]

export default function Shop() {
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [meta, setMeta] = useState({ total: 0, pages: 1 })
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const grid = useRef(null)
  const [tick, setTick] = useState(0)
  const silent = useRef(false)
  const pageRef = useRef(1)
  useEffect(() => { pageRef.current = page }, [page])

  const q = params.get('q') || ''
  const category = params.get('category') || ''
  const brand = params.get('brand') || ''
  const sort = params.get('sort') || 'newest'
  const minPrice = params.get('minPrice') || ''
  const maxPrice = params.get('maxPrice') || ''
  const inStock = params.get('inStock') === 'true'
  const sale = params.get('sale') === 'true'
  const key = params.toString()

  useEffect(() => { brandApi.list().then((r) => setBrands(r.data.brands)).catch(() => {}) }, [])

  useEffect(() => {
    let cancelled = false
    const quiet = silent.current // a live refresh: keep the grid on screen and the "show more" depth
    silent.current = false
    if (!quiet) { setLoading(true); setPage(1) }
    productApi.list({ q, category, brand, sort, minPrice, maxPrice, inStock: inStock || undefined, sale: sale || undefined, limit: quiet ? 12 * pageRef.current : 12, page: 1 })
      .then((r) => { if (!cancelled) { setProducts(r.data.products); setMeta({ total: r.data.total, pages: r.data.pages }) } })
      .catch(() => { if (!cancelled) setProducts([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick])

  // live updates
  useSocketEvent('product:updated', (p) => setProducts((l) => l.map((x) => (x._id === p._id ? p : x))))
  useSocketEvent('product:deleted', ({ id }) => setProducts((l) => l.filter((x) => x._id !== id)))
  useRefetchOn(['product:created', 'product:deleted'], () => { silent.current = true; setTick((t) => t + 1) })

  const loadMore = async () => {
    setLoadingMore(true)
    try {
      const next = page + 1
      const r = await productApi.list({ q, category, brand, sort, minPrice, maxPrice, inStock: inStock || undefined, sale: sale || undefined, limit: 12, page: next })
      setProducts((p) => [...p, ...r.data.products])
      setPage(next)
    } finally { setLoadingMore(false) }
  }

  useGSAP(() => {
    if (!products.length) return
    parallaxAll(grid.current)
    ScrollTrigger.refresh()
  }, { scope: grid, dependencies: [products] })

  useGSAP(() => {
    if (loading) return
    gsap.fromTo('[data-grid] article', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.05, clearProps: 'all' })
  }, { scope: grid, dependencies: [loading, key] })

  const set = (name, value) => {
    const next = new URLSearchParams(params)
    if (value === '' || value === false || value == null) next.delete(name); else next.set(name, value)
    setParams(next, { replace: true })
  }
  const clearAll = () => setParams({}, { replace: true })
  const activeCount = [q, category, brand, minPrice, maxPrice, inStock, sale].filter(Boolean).length

  const Filters = (
    <div className="space-y-9 text-sm">
      <div>
        <h3 className="mb-3 font-sans text-sm font-medium">Cut</h3>
        <ul className="space-y-1.5">
          <li><button className={`link-line ${!category ? 'active' : ''}`} onClick={() => set('category', '')}>All</button></li>
          {CATEGORIES.map((c) => (
            <li key={c}><button className={`link-line text-left ${category === c ? 'active text-mulberry' : ''}`} onClick={() => set('category', c)}>{c}</button></li>
          ))}
        </ul>
      </div>
      {brands.length > 0 && (
        <div>
          <label htmlFor="f-brand" className="mb-2 block font-medium">Brand</label>
          <select id="f-brand" className="field" value={brand} onChange={(e) => set('brand', e.target.value)}>
            <option value="">All brands</option>
            {brands.map((b) => <option key={b._id} value={b._id}>{brandName(b)}</option>)}
          </select>
        </div>
      )}
      <div>
        <h3 className="mb-2 font-sans text-sm font-medium">Price (PKR)</h3>
        <div className="flex items-center gap-3">
          <input className="field" inputMode="numeric" placeholder="Min" aria-label="Minimum price" defaultValue={minPrice} key={`min${minPrice}`} onBlur={(e) => set('minPrice', e.target.value.replace(/\D/g, ''))} />
          <span>–</span>
          <input className="field" inputMode="numeric" placeholder="Max" aria-label="Maximum price" defaultValue={maxPrice} key={`max${maxPrice}`} onBlur={(e) => set('maxPrice', e.target.value.replace(/\D/g, ''))} />
        </div>
      </div>
      <div className="space-y-3">
        <label className="flex cursor-pointer items-center gap-3"><input type="checkbox" className="accent-mulberry" checked={inStock} onChange={(e) => set('inStock', e.target.checked)} /> In stock only</label>
        <label className="flex cursor-pointer items-center gap-3"><input type="checkbox" className="accent-mulberry" checked={sale} onChange={(e) => set('sale', e.target.checked)} /> On sale</label>
      </div>
      {activeCount > 0 && <button onClick={clearAll} className="text-mulberry underline underline-offset-4">Clear all filters</button>}
    </div>
  )

  return (
    <div ref={grid}>
      <PageHead title={category || (q ? `“${q}”` : 'All abayas')} sub={loading ? ' ' : `${meta.total} ${meta.total === 1 ? 'piece' : 'pieces'}`}>
        <div className="flex items-center gap-5">
          <button className="text-sm link-line md:hidden" onClick={() => setFiltersOpen((v) => !v)}>
            {filtersOpen ? 'Hide filters' : `Filters${activeCount ? ` (${activeCount})` : ''}`}
          </button>
          <label className="flex items-center gap-3 text-sm">
            <span className="text-nida-soft">Sort</span>
            <select className="field !w-auto pr-6" value={sort} onChange={(e) => set('sort', e.target.value === 'newest' ? '' : e.target.value)}>
              {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        </div>
      </PageHead>

      <div className="mx-auto grid max-w-[1400px] gap-10 px-5 md:grid-cols-[220px_1fr] md:px-10">
        <aside className={`${filtersOpen ? 'block' : 'hidden'} md:block`}>
          <div className="md:sticky md:top-28">{Filters}</div>
        </aside>
        <section>
          {loading ? <ProductGridSkeleton count={6} className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-3" offset={(i) => i % 3 === 1} /> : products.length === 0 ? (
            <Empty title="Nothing matches" text="Try removing a filter or searching for something broader." action={activeCount ? undefined : { to: '/', label: 'Back home' }} />
          ) : (
            <>
              <div data-grid className="grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-3">
                {products.map((p, i) => <ProductCard key={p._id} product={p} index={i} offset={i % 3 === 1} />)}
              </div>
              {page < meta.pages && (
                <div className="mt-16 text-center">
                  <button className="btn btn-ghost" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Loading…' : 'Show more'}</button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
