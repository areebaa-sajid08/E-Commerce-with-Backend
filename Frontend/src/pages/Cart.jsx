import { Link } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { money, brandName } from '../lib/format'
import QtyStepper from '../components/QtyStepper'
import Fabric from '../components/Fabric'
import { Empty, PageHead } from '../components/States'
import { Bone, CartLinesSkeleton } from '../components/Skeleton'

export default function Cart() {
  const { items, subtotal, count, setQty, remove, clear, busy, ready } = useCart()
  const unavailable = items.some((i) => !i.available)

  if (!ready) {
    return (
      <div>
        <PageHead title="Your bag" />
        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 md:grid-cols-[1.6fr_1fr] md:px-10">
          <CartLinesSkeleton count={2} />
          <Bone className="h-72" />
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return <div className="px-5 pt-40"><Empty title="Your bag is empty" text="Pieces you add will wait for you here." action={{ to: '/shop', label: 'Browse abayas' }} /></div>
  }

  return (
    <div>
      <PageHead title="Your bag" sub={`${count} ${count === 1 ? 'item' : 'items'}`}>
        <button onClick={clear} className="text-sm text-mulberry underline underline-offset-4">Empty bag</button>
      </PageHead>
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 md:grid-cols-[1.6fr_1fr] md:px-10">
        <ul className="divide-y divide-mist border-y border-mist">
          {items.map((it, i) => (
            <li key={it._id} className="flex gap-5 py-6">
              <Link to={`/product/${it.product._id}`} className="block h-40 w-28 shrink-0 overflow-hidden bg-chiffon md:h-48 md:w-36">
                {it.product.image ? <img src={it.product.image} alt={it.product.name} className="h-full w-full object-cover" /> : <Fabric seed={i} className="h-full w-full" />}
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="text-sm text-nida-soft">{brandName(it.product.admin)}</p>
                <Link to={`/product/${it.product._id}`} className="font-display text-3xl leading-tight hover:text-mulberry">{it.product.name}</Link>
                <p className="mt-1 text-sm text-nida-soft">{[it.size && `Size ${it.size}`, it.color].filter(Boolean).join(' · ')}</p>
                <p className="mt-1 text-sm">{money(it.product.price)} each</p>
                {!it.available && <p className="mt-2 text-sm text-mulberry">Only {it.product.stock} in stock. Lower the quantity to continue.</p>}
                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
                  <QtyStepper value={it.quantity} max={Math.max(it.product.stock, 1)} disabled={busy} onChange={(q) => setQty(it._id, q)} />
                  <div className="flex items-center gap-5">
                    <span className="font-medium">{money(it.lineTotal)}</span>
                    <button onClick={() => remove(it._id)} disabled={busy} className="text-sm text-mulberry underline underline-offset-4">Remove</button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <aside className="h-fit bg-chiffon p-8 md:sticky md:top-28">
          <h2 className="text-3xl">Summary</h2>
          <dl className="mt-6 space-y-3 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div>
            <div className="flex justify-between text-nida-soft"><dt>Delivery</dt><dd>Calculated at checkout</dd></div>
          </dl>
          <Link to="/checkout" className={`btn mt-8 w-full ${unavailable ? 'pointer-events-none opacity-50' : ''}`} aria-disabled={unavailable}>Continue to checkout</Link>
          <Link to="/shop" className="mt-4 block text-center text-sm link-line">Keep shopping</Link>
        </aside>
      </div>
    </div>
  )
}
