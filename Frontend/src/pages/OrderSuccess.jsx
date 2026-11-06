import { Link, Navigate, useLocation } from 'react-router-dom'
import { money, brandName } from '../lib/format'
import { gsap, useGSAP } from '../lib/gsap'
import { useRef } from 'react'

export default function OrderSuccess() {
  const { state } = useLocation()
  const root = useRef(null)
  useGSAP(() => {
    gsap.from('[data-line]', { yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: 0.1, delay: 0.6 })
  }, { scope: root })

  if (!state?.orders) return <Navigate to="/orders" replace />
  return (
    <div ref={root} className="mx-auto max-w-3xl px-5 pb-10 pt-44">
      <h1 className="text-6xl leading-[1] md:text-8xl">
        <span className="mask-line"><span data-line>Order placed.</span></span>
        <span className="mask-line"><span data-line>Shukran.</span></span>
      </h1>
      <p className="mt-8 text-nida-soft">
        {state.orders.length > 1 ? `Your items are shipping from ${state.orders.length} brands, so you’ll receive separate parcels.` : 'The brand will confirm your order shortly.'} Keep {money(state.grandTotal)} ready for the courier.
      </p>
      <ul className="mt-10 divide-y divide-mist border-y border-mist">
        {state.orders.map((o) => (
          <li key={o._id} className="py-4 text-sm">
            <div className="flex justify-between"><span className="font-medium">{o.brandName || brandName(o.brand)}</span><span>{money(o.total)}</span></div>
            <p className="text-nida-soft">{o.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}</p>
          </li>
        ))}
      </ul>
      <div className="mt-10 flex gap-4">
        <Link to="/orders" className="btn">View my orders</Link>
        <Link to="/shop" className="btn btn-ghost">Keep shopping</Link>
      </div>
    </div>
  )
}
