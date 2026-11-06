import { useEffect, useState } from 'react'
import { wishlistApi } from '../lib/api'
import { useCart } from '../context/CartContext'
import ProductCard from '../components/ProductCard'
import { Empty, PageHead } from '../components/States'
import { ProductGridSkeleton } from '../components/Skeleton'
import { useRefetchOn } from '../lib/useSocket'

export default function Wishlist() {
  const [items, setItems] = useState(null)
  const { wishIds } = useCart()

  const load = () => wishlistApi.get().then((r) => setItems(r.data.wishlist)).catch(() => setItems((i) => i || []))
   
  useEffect(() => { load() }, [])
  useRefetchOn(['wishlist:updated', 'wishlist:refresh', 'product:updated', 'product:deleted'], load)
  const visible = items?.filter((p) => wishIds.includes(p._id))

  return (
    <div>
      <PageHead title="Saved" sub="Pieces you’re keeping an eye on." />
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        {!items ? <ProductGridSkeleton count={4} offset={() => false} /> : visible.length === 0 ? (
          <Empty title="Nothing saved" text="Tap Save on any abaya and it will show up here." action={{ to: '/shop', label: 'Browse abayas' }} />
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-12 md:grid-cols-4">
            {visible.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
          </div>
        )}
      </div>
    </div>
  )
}
