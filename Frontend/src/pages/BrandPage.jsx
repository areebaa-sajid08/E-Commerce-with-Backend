import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ScrollTrigger, useGSAP, parallaxAll } from '../lib/gsap'
import { brandApi } from '../lib/api'
import ProductCard from '../components/ProductCard'
import { Empty } from '../components/States'
import { BrandHeaderSkeleton, ProductGridSkeleton } from '../components/Skeleton'
import Fabric from '../components/Fabric'
import NotFound from './NotFound'
import { useSocketEvent, useRefetchOn } from '../lib/useSocket'

export default function BrandPage() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [missing, setMissing] = useState(false)
  const root = useRef(null)
  const load = () => brandApi.one(id).then((r) => setData(r.data)).catch((e) => { if (e.response?.status === 404) setMissing(true) })

  useEffect(() => {
    setData(null); setMissing(false)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // live: the brand's pieces change, or the brand is removed
  useRefetchOn(['product:created', 'product:updated', 'product:deleted'], load)
  useSocketEvent('brand:deleted', ({ id: gone }) => { if (gone === id) setMissing(true) })

  useGSAP(() => {
    if (!data?.products.length) return
    parallaxAll(root.current)
    ScrollTrigger.refresh()
  }, { scope: root, dependencies: [data] })

  if (missing) return <NotFound />
  if (!data) {
    return (
      <div className="mx-auto max-w-[1400px] px-5 pt-36 md:px-10">
        <BrandHeaderSkeleton />
        <div className="mt-20"><ProductGridSkeleton count={4} /></div>
      </div>
    )
  }
  const { brand, products } = data

  return (
    <div ref={root} className="mx-auto max-w-[1400px] px-5 pt-36 md:px-10">
      <header className="flex flex-col gap-8 md:flex-row md:items-end">
        <div className="h-28 w-28 shrink-0 overflow-hidden rounded-full bg-chiffon md:h-40 md:w-40">
          {brand.brand?.logo ? <img src={brand.brand.logo} alt="" className="h-full w-full object-cover" /> : <Fabric seed={brand.username} pleat={24} className="h-full w-full" />}
        </div>
        <div>
          <h1 className="text-6xl md:text-8xl">{brand.brand?.name || brand.username}</h1>
          {brand.brand?.description && <p className="mt-4 max-w-xl text-nida-soft">{brand.brand.description}</p>}
        </div>
      </header>
      <div className="mt-20">
        {products.length === 0 ? <Empty title="Nothing listed yet" text="This brand hasn’t added any pieces." /> : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-4">
            {products.map((p, i) => <ProductCard key={p._id} product={{ ...p, admin: brand }} index={i} offset={i % 2 === 1} />)}
          </div>
        )}
      </div>
    </div>
  )
}
