import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap, useGSAP, prefersReducedMotion } from '../../lib/gsap'
import { productApi, orderApi } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { money, dateLabel, apiError } from '../../lib/format'
import { STATUS_FLOW, ORDER_STATUS_LABEL } from '../../lib/constants'
import { Empty } from '../../components/States'
import { StatsSkeleton, ListRowsSkeleton, OrderCardsSkeleton } from '../../components/Skeleton'
import { StatusBadge } from '../Orders'
import ProductForm from './ProductForm'
import { useRefetchOn } from '../../lib/useSocket'

const TABS = ['Overview', 'Products', 'Orders']

export function Stat({ label, value, format = (v) => v.toLocaleString('en-PK') }) {
  const ref = useRef(null)
  useGSAP(() => {
    if (prefersReducedMotion()) { ref.current.textContent = format(value); return }
    const o = { v: 0 }
    gsap.to(o, { v: value, duration: 1.4, ease: 'power3.out', onUpdate: () => { if (ref.current) ref.current.textContent = format(Math.round(o.v)) } })
  }, { dependencies: [value] })
  return (
    <div className="border-t border-nida pt-4">
      <p ref={ref} className="font-display text-5xl md:text-6xl">0</p>
      <p className="mt-1 text-sm text-nida-soft">{label}</p>
    </div>
  )
}

export default function BrandDashboard() {
  const { user } = useAuth()
  const toast = useToast()
  const [tab, setTab] = useState('Overview')
  const [stats, setStats] = useState(null)
  const [products, setProducts] = useState(null)
  const [orders, setOrders] = useState(null)
  const [form, setForm] = useState(null) // null | 'new' | product

  const loadProducts = () => productApi.mine().then((r) => setProducts(r.data.products)).catch(() => setProducts([]))
  const loadOrders = () => orderApi.brandList().then((r) => setOrders(r.data.orders)).catch(() => setOrders([]))
  const loadStats = () => orderApi.brandStats().then((r) => setStats(r.data.stats)).catch(() => {})
   
  useEffect(() => { loadProducts(); loadOrders(); loadStats() }, [])

  // live: new orders and status changes, stock moving as items sell
  useRefetchOn(['order:created', 'order:updated'], () => { loadOrders(); loadStats(); loadProducts() })
  useRefetchOn(['product:created', 'product:updated', 'product:deleted'], () => { loadProducts(); loadStats() }, 600)

  const removeProduct = async (p) => {
    if (!window.confirm(`Delete “${p.name}”? This can’t be undone.`)) return
    try { await productApi.remove(p._id); toast('Product deleted'); loadProducts(); loadStats() } catch (err) { toast(apiError(err), 'error') }
  }
  const setStatus = async (o, status) => {
    try { await orderApi.setStatus(o._id, status); toast(`Order marked ${ORDER_STATUS_LABEL[status].toLowerCase()}`); loadOrders(); loadStats(); loadProducts() } catch (err) { toast(apiError(err), 'error') }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-10 pt-36 md:px-10">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-sm text-nida-soft">Brand dashboard</p>
          <h1 className="text-5xl md:text-7xl">{user.brand?.name}</h1>
        </div>
        <button className="btn" onClick={() => setForm('new')}>Add product</button>
      </header>

      <div className="mt-10 flex gap-8 border-b border-mist" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`-mb-px border-b-2 pb-3 text-sm transition-colors ${tab === t ? 'border-mulberry text-nida' : 'border-transparent text-nida-soft hover:text-nida'}`}>
            {t}{t === 'Orders' && stats?.pending > 0 && <span className="ml-2 rounded-full bg-mulberry px-2 py-0.5 text-xs text-chiffon">{stats.pending}</span>}
          </button>
        ))}
      </div>

      <div className="mt-10">
        {tab === 'Overview' && (!stats ? <StatsSkeleton /> : (
          <>
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              <Stat label="Products listed" value={stats.products} />
              <Stat label="Orders received" value={stats.orders} />
              <Stat label="Awaiting confirmation" value={stats.pending} />
              <Stat label="Delivered revenue" value={stats.revenue} format={money} />
            </div>
            {stats.lowStock > 0 && <p className="mt-10 text-mulberry">{stats.lowStock} {stats.lowStock === 1 ? 'product is' : 'products are'} almost out of stock. <button className="underline underline-offset-4" onClick={() => setTab('Products')}>Review stock</button></p>}
            {stats.products === 0 && <Empty title="Your shop is empty" text="Add your first abaya to make it visible to customers." />}
          </>
        ))}

        {tab === 'Products' && (!products ? <ListRowsSkeleton /> : products.length === 0 ? (
          <Empty title="No products yet" text="Add photos, a price and the sizes you stock." />
        ) : (
          <ul className="divide-y divide-mist border-y border-mist">
            {products.map((p) => (
              <li key={p._id} className="flex flex-wrap items-center gap-5 py-4">
                <img src={p.image} alt="" className="h-24 w-[4.5rem] object-cover" />
                <div className="min-w-0 flex-1">
                  <Link to={`/product/${p._id}`} className="font-display text-2xl hover:text-mulberry">{p.name}</Link>
                  <p className="text-sm text-nida-soft">{p.category} · {money(p.price)}{p.comparePrice > p.price && ` (was ${money(p.comparePrice)})`}</p>
                </div>
                <p className={`text-sm ${p.stock === 0 ? 'text-mulberry' : p.stock <= 3 ? 'text-mulberry' : 'text-nida-soft'}`}>{p.stock === 0 ? 'Sold out' : `${p.stock} in stock`}</p>
                <div className="flex gap-3">
                  <button className="btn btn-ghost btn-sm" onClick={() => setForm(p)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => removeProduct(p)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        ))}

        {tab === 'Orders' && (!orders ? <OrderCardsSkeleton /> : orders.length === 0 ? (
          <Empty title="No orders yet" text="Orders for your products will appear here." />
        ) : (
          <ul className="space-y-6">
            {orders.map((o) => (
              <li key={o._id} className="border border-mist bg-chiffon/50 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-nida-soft">#{o._id.slice(-6).toUpperCase()} · {dateLabel(o.createdAt)} · {o.user?.username}</p>
                  <StatusBadge status={o.status} />
                </div>
                <ul className="mt-4 text-sm">
                  {o.items.map((it, i) => (
                    <li key={i} className="flex justify-between gap-4 py-1">
                      <span>{it.name} × {it.quantity}{(it.size || it.color) && <span className="text-nida-soft"> · {[it.size, it.color].filter(Boolean).join(', ')}</span>}</span>
                      <span>{money(it.price * it.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 grid gap-4 border-t border-mist pt-4 text-sm md:grid-cols-2">
                  <div>
                    <p className="font-medium">{o.shipping.fullName} · {o.shipping.phone}</p>
                    <p className="text-nida-soft">{o.shipping.address}, {o.shipping.city} {o.shipping.postalCode}</p>
                    {o.shipping.notes && <p className="mt-1 text-nida-soft">Note: {o.shipping.notes}</p>}
                  </div>
                  <div className="md:text-right">
                    <p className="text-nida-soft">Collect on delivery</p>
                    <p className="font-display text-3xl">{money(o.total)}</p>
                  </div>
                </div>
                {STATUS_FLOW[o.status].length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {STATUS_FLOW[o.status].map((s) => (
                      <button key={s} className={`btn btn-sm ${s === 'cancelled' ? 'btn-danger' : ''}`} onClick={() => setStatus(o, s)}>
                        {s === 'cancelled' ? 'Cancel order' : `Mark ${ORDER_STATUS_LABEL[s].toLowerCase()}`}
                      </button>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        ))}
      </div>

      {form && (
        <ProductForm
          product={form === 'new' ? null : form}
          onClose={() => setForm(null)}
          onSaved={() => { setForm(null); loadProducts(); loadStats() }}
        />
      )}
    </div>
  )
}
