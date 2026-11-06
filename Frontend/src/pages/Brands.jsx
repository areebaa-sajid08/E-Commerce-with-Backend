import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap, useGSAP } from '../lib/gsap'
import { brandApi } from '../lib/api'
import { brandName } from '../lib/format'
import { Empty, PageHead } from '../components/States'
import { BrandRowsSkeleton } from '../components/Skeleton'
import { useRefetchOn } from '../lib/useSocket'
import Fabric from '../components/Fabric'

export default function Brands() {
  const [brands, setBrands] = useState(null)
  const root = useRef(null)
  const load = () => brandApi.list().then((r) => setBrands(r.data.brands)).catch(() => setBrands((b) => b || []))
   
  useEffect(() => { load() }, [])
  useRefetchOn(['brand:created', 'brand:deleted', 'product:created', 'product:deleted'], load)

  useGSAP(() => {
    if (!brands?.length) return
    gsap.from('[data-brand]', { yPercent: 100, duration: 0.9, ease: 'power4.out', stagger: 0.07 })
  }, { scope: root, dependencies: [brands?.map((b) => b._id).join()] })

  return (
    <div ref={root}>
      <PageHead title="Brands" sub="Every abaya here is made and shipped by the brand that designed it." />
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        {!brands ? <BrandRowsSkeleton /> : brands.length === 0 ? (
          <Empty title="No brands yet" text="Be the first to open a shop." action={{ to: '/register-brand', label: 'Open your shop' }} />
        ) : (
          <ul>
            {brands.map((b, i) => (
              <li key={b._id} className="overflow-hidden border-t border-mist last:border-b">
                <Link to={`/brands/${b._id}`} data-brand className="group flex items-center gap-6 py-6 transition-[padding] duration-500 hover:pl-4 md:gap-10">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-chiffon md:h-24 md:w-24">
                    {b.brand?.logo ? <img src={b.brand.logo} alt="" className="h-full w-full object-cover" /> : <Fabric seed={i} pleat={20} className="h-full w-full" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-4xl transition-colors group-hover:text-mulberry md:text-7xl">{brandName(b)}</h2>
                    {b.brand?.description && <p className="mt-1 line-clamp-1 max-w-2xl text-sm text-nida-soft">{b.brand.description}</p>}
                  </div>
                  <span className="shrink-0 text-sm text-nida-soft">{b.productCount} {b.productCount === 1 ? 'piece' : 'pieces'}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
