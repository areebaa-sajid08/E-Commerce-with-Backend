import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { orderApi } from '../lib/api'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { money, brandName, apiError } from '../lib/format'
import { PageHead, Empty } from '../components/States'
import { Bone } from '../components/Skeleton'

export default function Checkout() {
  const { items, subtotal, shipping, total, parcels, refreshCart, ready } = useCart()
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', phone: '', address: '', city: '', postalCode: '', notes: '' })
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')

  if (!ready) {
    return (
      <div>
        <PageHead title="Checkout" />
        <div className="mx-auto grid max-w-[1400px] gap-14 px-5 md:grid-cols-[1.3fr_1fr] md:px-10">
          <div className="space-y-6">{[0, 1, 2, 3].map((i) => <Bone key={i} className="h-12" />)}</div>
          <Bone className="h-80" />
        </div>
      </div>
    )
  }

  if (items.length === 0 && !placing) {
    return <div className="px-5 pt-40"><Empty title="Your bag is empty" text="Add something before checking out." action={{ to: '/shop', label: 'Browse abayas' }} /></div>
  }

  const on = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setPlacing(true)
    try {
      const res = await orderApi.checkout({ shipping: form, paymentMethod: 'cod' })
      await refreshCart()
      navigate('/order-success', { state: { orders: res.data.orders, grandTotal: res.data.grandTotal }, replace: true })
    } catch (err) {
      const msg = apiError(err)
      setError(msg); toast(msg, 'error')
      setPlacing(false)
      refreshCart().catch(() => {})
    }
  }

  return (
    <div>
      <PageHead title="Checkout" sub="Pay in cash when your order arrives." />
      <form onSubmit={submit} className="mx-auto grid max-w-[1400px] gap-14 px-5 md:grid-cols-[1.3fr_1fr] md:px-10">
        <div className="space-y-6">
          <h2 className="text-3xl">Delivery details</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <label className="block text-sm">Full name<input required className="field" value={form.fullName} onChange={on('fullName')} autoComplete="name" /></label>
            <label className="block text-sm">Phone<input required className="field" inputMode="tel" placeholder="03xx xxxxxxx" value={form.phone} onChange={on('phone')} autoComplete="tel" /></label>
          </div>
          <label className="block text-sm">Full address<input required className="field" placeholder="House, street, area" value={form.address} onChange={on('address')} autoComplete="street-address" /></label>
          <div className="grid gap-6 md:grid-cols-2">
            <label className="block text-sm">City<input required className="field" value={form.city} onChange={on('city')} autoComplete="address-level2" /></label>
            <label className="block text-sm">Postal code <span className="text-nida-soft">(optional)</span><input className="field" value={form.postalCode} onChange={on('postalCode')} autoComplete="postal-code" /></label>
          </div>
          <label className="block text-sm">Note for the brand <span className="text-nida-soft">(optional)</span><input className="field" value={form.notes} onChange={on('notes')} /></label>

          <div className="border border-mist p-5 text-sm">
            <p className="font-medium">Payment: cash on delivery</p>
            <p className="mt-1 text-nida-soft">You pay the courier when the parcel arrives.</p>
          </div>
          {error && <p className="text-sm text-mulberry" role="alert">{error}</p>}
        </div>

        <aside className="h-fit bg-chiffon p-8 md:sticky md:top-28">
          <h2 className="text-3xl">Your order</h2>
          <ul className="mt-6 divide-y divide-mist">
            {items.map((it) => (
              <li key={it._id} className="flex justify-between gap-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{it.product.name} × {it.quantity}</p>
                  <p className="text-nida-soft">{brandName(it.product.admin)}{(it.size || it.color) && ` · ${[it.size, it.color].filter(Boolean).join(', ')}`}</p>
                </div>
                <span>{money(it.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2 border-t border-mist pt-5 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{money(subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Delivery{parcels > 1 ? ` (${parcels} parcels)` : ''}</dt><dd>{shipping === 0 ? 'Free' : money(shipping)}</dd></div>
            <div className="flex items-baseline justify-between pt-2"><dt>Total</dt><dd className="font-display text-3xl">{money(total)}</dd></div>
          </dl>
          <button className="btn mt-8 w-full" disabled={placing || items.some((i) => !i.available)}>{placing ? 'Placing order…' : 'Place order'}</button>
          <Link to="/cart" className="mt-4 block text-center text-sm link-line">Back to bag</Link>
        </aside>
      </form>
    </div>
  )
}
