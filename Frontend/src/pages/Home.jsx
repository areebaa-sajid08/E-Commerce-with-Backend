import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { gsap, ScrollTrigger, useGSAP, parallaxAll, prefersReducedMotion } from '../lib/gsap'
import { intro } from '../lib/scroll'
import { productApi, brandApi } from '../lib/api'
import { CATEGORIES, FABRICS } from '../lib/constants'
import { brandName } from '../lib/format'
import { useSocketEvent, useRefetchOn } from '../lib/useSocket'
import ProductCard from '../components/ProductCard'
import Fabric from '../components/Fabric'
import { ProductGridSkeleton } from '../components/Skeleton'

export default function Home() {
  const root = useRef(null)
  const [products, setProducts] = useState([])
  const [brands, setBrands] = useState([])
  const [loaded, setLoaded] = useState(false)

  const revealed = useRef(false)
  const loadProducts = () => productApi.list({ limit: 8, sort: 'newest' }).then((r) => setProducts(r.data.products)).catch(() => {})
  const loadBrands = () => brandApi.list().then((r) => setBrands(r.data.brands)).catch(() => {})

  useEffect(() => {
    Promise.all([loadProducts(), loadBrands()]).finally(() => setLoaded(true))
     
  }, [])

  // live: price/stock edits patch in place, new or removed pieces refetch
  useSocketEvent('product:updated', (p) => setProducts((list) => list.map((x) => (x._id === p._id ? p : x))))
  useRefetchOn(['product:created', 'product:deleted'], loadProducts)
  useRefetchOn(['brand:created', 'brand:deleted', 'product:created', 'product:deleted'], loadBrands)

  // hero + category index: runs once on mount
  useGSAP(() => {
    if (prefersReducedMotion()) return
    const wait = intro.pending ? 2.35 : 0.55
    gsap.from('[data-hero-line] > span', { yPercent: 112, duration: 1.3, ease: 'power4.out', stagger: 0.12, delay: wait })
    gsap.from('[data-hero-sub]', { opacity: 0, y: 16, duration: 0.9, ease: 'power2.out', delay: wait + 0.7 })
    gsap.from('[data-swatch]', { yPercent: 105, duration: 1.5, ease: 'power4.out', stagger: 0.1, delay: wait + 0.1 })
    gsap.utils.toArray('[data-swatch-inner]').forEach((el, i) => {
      gsap.to(el, {
        yPercent: i % 2 ? -9 : 9, ease: 'none',
        scrollTrigger: { trigger: '[data-hero]', start: 'top top', end: 'bottom top', scrub: true },
      })
    })
  }, { scope: root })

  // brand marquee that speeds up with scroll velocity
  useGSAP(() => {
    if (prefersReducedMotion() || !brands.length) return
    const loop = gsap.to('[data-marquee]', { xPercent: -50, duration: 38, ease: 'none', repeat: -1 })
    ScrollTrigger.create({
      onUpdate: (self) => {
        const v = Math.min(Math.abs(self.getVelocity()) / 400, 6)
        gsap.to(loop, { timeScale: 1 + v, duration: 0.2, overwrite: true })
        gsap.to(loop, { timeScale: 1, duration: 1, delay: 0.2, overwrite: false })
      },
    })
  }, { scope: root, dependencies: [brands.map((b) => b._id).join()] })

  // product reveal + parallax once products are in
  useGSAP(() => {
    if (!products.length) return
    parallaxAll(root.current)
    if (prefersReducedMotion() || revealed.current) return
    revealed.current = true // the entrance plays once; later live updates must not replay it
    gsap.from('[data-new] article', {
      yPercent: 6, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.08,
      scrollTrigger: { trigger: '[data-new]', start: 'top 80%' },
    })
    ScrollTrigger.refresh()
  }, { scope: root, dependencies: [products.map((p) => p._id).join()] })

  return (
    <div ref={root}>
      <Hero />
      <CategoryIndex />

      {brands.length > 0 && (
        <section className="overflow-hidden border-y border-mist py-8" aria-label="Brands on Naqsh">
          <div data-marquee className="flex w-max whitespace-nowrap">
            {[0, 1].map((k) => (
              <div key={k} className="flex items-center" aria-hidden={k === 1}>
                {brands.map((b) => (
                  <Link key={b._id + k} to={`/brands/${b._id}`} className="px-8 font-display text-5xl transition-colors hover:text-mulberry md:text-7xl">
                    {brandName(b)}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-[1400px] px-5 pt-28 md:px-10">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-5xl md:text-7xl">Just arrived</h2>
          <Link to="/shop" className="link-line text-sm">See everything</Link>
        </div>
        {products.length > 0 ? (
          <div data-new className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-4 md:gap-x-8">
            {products.map((p, i) => <ProductCard key={p._id} product={p} index={i} offset={i % 2 === 1} />)}
          </div>
        ) : !loaded ? (
          <ProductGridSkeleton count={8} className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-4 md:gap-x-8" />
        ) : (
          <div className="grid gap-5 md:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <Fabric key={i} seed={i} className="aspect-[3/4]" />)}
            <p className="text-nida-soft md:col-span-4">No abayas have been listed yet. Brands can <Link to="/register-brand" className="underline underline-offset-4">open a shop</Link> and add the first ones.</p>
          </div>
        )}
      </section>

      <section className="mx-auto mt-32 grid max-w-[1400px] gap-10 px-5 md:grid-cols-2 md:px-10">
        <div>
          <h2 className="text-5xl md:text-7xl">Run an abaya brand?</h2>
          <p className="mt-6 max-w-md text-nida-soft">
            Open your shop here, list each piece with its sizes and colours, and manage your orders from one dashboard.
          </p>
          <Link to="/register-brand" className="btn mt-8">Open your shop</Link>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <Fabric key={i} seed={i + 1} pleat={40} className={`arch aspect-[1/2] ${i === 1 ? 'mt-10' : ''}`} />
          ))}
        </div>
      </section>
    </div>
  )
}

function Hero() {
  const colors = [FABRICS[0], FABRICS[1], FABRICS[2], FABRICS[3]]
  return (
    <section data-hero className="relative mx-auto flex min-h-[100svh] max-w-[1400px] flex-col justify-end px-5 pb-16 pt-32 md:px-10">
      <div className="pointer-events-none absolute right-5 top-28 hidden gap-4 md:flex md:right-10">
        {colors.map((c, i) => (
          <div key={c} data-swatch className={`overflow-hidden ${i % 2 ? 'mt-16' : ''}`} style={{ width: 'clamp(70px, 8vw, 130px)' }}>
            <div data-swatch-inner className="fabric arch aspect-[1/3.2]" style={{ '--fabric': c, '--pleat': '34px' }} />
          </div>
        ))}
      </div>
      <h1 className="max-w-[16ch] text-[clamp(3.4rem,10.5vw,10rem)] leading-[0.92]">
        <span data-hero-line className="mask-line"><span>The cut,</span></span>
        <span data-hero-line className="mask-line"><span>the cloth,</span></span>
        <span data-hero-line className="mask-line"><span>the brand.</span></span>
      </h1>
      <div data-hero-sub className="mt-10 flex max-w-xl flex-wrap items-center gap-6">
        <p className="text-nida-soft">Abayas from independent brands, side by side. Pay when it arrives.</p>
        <Link to="/shop" className="btn">Shop abayas</Link>
      </div>
    </section>
  )
}

// Large type index. A fabric swatch follows the cursor and changes with the row.
function CategoryIndex() {
  const root = useRef(null)
  const swatch = useRef(null)
  const navigate = useNavigate()
  const move = useRef({})

  useGSAP(() => {
    if (prefersReducedMotion()) return
    move.current.x = gsap.quickTo(swatch.current, 'x', { duration: 0.5, ease: 'power3' })
    move.current.y = gsap.quickTo(swatch.current, 'y', { duration: 0.5, ease: 'power3' })
  }, { scope: root })

  const onMove = (e) => {
    const r = root.current.getBoundingClientRect()
    move.current.x?.(e.clientX - r.left + 28)
    move.current.y?.(e.clientY - r.top - 90)
  }
  const show = (i) => {
    if (!swatch.current) return
    swatch.current.style.setProperty('--fabric', FABRICS[i % FABRICS.length])
    gsap.to(swatch.current, { opacity: 1, scale: 1, duration: 0.35, ease: 'power3.out' })
  }
  const hide = () => swatch.current && gsap.to(swatch.current, { opacity: 0, scale: 0.8, duration: 0.25 })

  return (
    <section ref={root} onMouseMove={onMove} className="relative mx-auto max-w-[1400px] px-5 py-24 md:px-10" aria-label="Shop by cut">
      <h2 className="mb-10 text-2xl text-nida-soft">Shop by cut</h2>
      <ul>
        {CATEGORIES.map((c, i) => (
          <li key={c} className="border-t border-mist last:border-b">
            <button
              onClick={() => navigate(`/shop?category=${encodeURIComponent(c)}`)}
              onMouseEnter={() => show(i)} onMouseLeave={hide} onFocus={() => show(i)} onBlur={hide}
              className="group flex w-full items-baseline justify-between py-4 text-left transition-[padding,color] duration-500 hover:pl-6 hover:text-mulberry md:py-5"
            >
              <span className="font-display text-5xl leading-none md:text-8xl">{c}</span>
              <span className="hidden text-sm text-nida-soft md:inline">Browse</span>
            </button>
          </li>
        ))}
      </ul>
      <div
        ref={swatch}
        className="fabric pointer-events-none absolute left-0 top-0 z-10 hidden h-44 w-32 scale-75 opacity-0 md:block arch"
        style={{ '--pleat': '28px' }}
        aria-hidden="true"
      />
    </section>
  )
}
