import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { productApi, superApi, orderApi } from '../../lib/api'
import { useToast } from '../../context/ToastContext'
import { money, dateLabel, apiError, brandName } from '../../lib/format'
import { STATUS_FLOW, ORDER_STATUS_LABEL } from '../../lib/constants'
import { Empty } from '../../components/States'
import { StatsSkeleton, ListRowsSkeleton, OrderCardsSkeleton } from '../../components/Skeleton'
import { StatusBadge } from '../Orders'
import { Stat } from './BrandDashboard'
import { useRefetchOn } from '../../lib/useSocket'

const TABS = ['Overview', 'Brands', 'Products', 'Customers', 'Orders']

export default function AdminPanel() {
  const toast = useToast()
  const [tab, setTab] = useState('Overview')
  const [data, setData] = useState({})

  const load = async (key, fn, pick) => {
    try { const r = await fn(); setData((d) => ({ ...d, [key]: pick(r.data) })) } catch { setData((d) => ({ ...d, [key]: key === 'stats' ? null : [] })) }
  }
  const refresh = (which = TABS) => {
    if (which.includes('Overview')) load('stats', superApi.stats, (d) => d)
    if (which.includes('Brands')) load('brands', superApi.brands, (d) => d.brands)
    if (which.includes('Products')) load('products', () => productApi.list({ limit: 60 }), (d) => d.products)
    if (which.includes('Customers')) load('users', superApi.users, (d) => d.users)
    if (which.includes('Orders')) load('orders', superApi.orders, (d) => d.orders)
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { refresh() }, [])
  // live: any signup, brand, product or order change refreshes the tabs
  useRefetchOn('admin:refresh', () => refresh(), 600)

  const act = async (fn, confirmMsg, okMsg, reload) => {
    if (!window.confirm(confirmMsg)) return
    try { await fn(); toast(okMsg); refresh(reload) } catch (err) { toast(apiError(err), 'error') }
  }

  const delBrand = (b) => act(() => superApi.deleteBrand(b._id),
    `Delete brand “${brandName(b)}”? All of its ${b.productCount} products will be deleted too.`, 'Brand deleted', ['Overview', 'Brands', 'Products'])
  const delProduct = (p) => act(() => productApi.remove(p._id), `Delete “${p.name}”?`, 'Product deleted', ['Overview', 'Brands', 'Products'])
  const delUser = (u) => act(() => superApi.deleteUser(u._id), `Delete customer ${u.username}?`, 'Customer deleted', ['Overview', 'Customers'])
  const setStatus = async (o, s) => {
    try { await orderApi.setStatus(o._id, s); toast('Order updated'); refresh(['Orders', 'Overview']) } catch (err) { toast(apiError(err), 'error') }
  }

  const list = 'divide-y divide-mist border-y border-mist'
  const Loading = (v) => v === undefined

  return (
    <div className="mx-auto max-w-[1400px] px-5 pb-10 pt-36 md:px-10">
      <p className="text-sm text-nida-soft">Super admin</p>
      <h1 className="text-5xl md:text-7xl">Marketplace</h1>

      <div className="mt-10 flex flex-wrap gap-x-8 border-b border-mist" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`-mb-px border-b-2 pb-3 text-sm transition-colors ${tab === t ? 'border-mulberry text-nida' : 'border-transparent text-nida-soft hover:text-nida'}`}>{t}</button>
        ))}
      </div>

      <div className="mt-10">
        {tab === 'Overview' && (Loading(data.stats) ? <StatsSkeleton count={5} /> : data.stats && (
          <>
            <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
              <Stat label="Brands" value={data.stats.stats.brands} />
              <Stat label="Products" value={data.stats.stats.products} />
              <Stat label="Customers" value={data.stats.stats.users} />
              <Stat label="Orders" value={data.stats.stats.orders} />
              <Stat label="Delivered revenue" value={data.stats.stats.revenue} format={money} />
            </div>
            <h2 className="mb-4 mt-16 text-3xl">Latest orders</h2>
            <ul className={list}>
              {data.stats.recentOrders.length === 0 && <li className="py-4 text-nida-soft">No orders yet.</li>}
              {data.stats.recentOrders.map((o) => (
                <li key={o._id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <span>{o.brandName} · {o.user?.username} · {dateLabel(o.createdAt)}</span>
                  <span className="flex items-center gap-4"><StatusBadge status={o.status} /> {money(o.total)}</span>
                </li>
              ))}
            </ul>
          </>
        ))}

        {tab === 'Brands' && (Loading(data.brands) ? <ListRowsSkeleton image={false} /> : data.brands.length === 0 ? <Empty title="No brands" /> : (
          <ul className={list}>
            {data.brands.map((b) => (
              <li key={b._id} className="flex flex-wrap items-center gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <Link to={`/brands/${b._id}`} className="font-display text-2xl hover:text-mulberry">{brandName(b)}</Link>
                  <p className="text-sm text-nida-soft">{b.email} · joined {dateLabel(b.createdAt)} · {b.productCount} products</p>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => delBrand(b)}>Delete brand</button>
              </li>
            ))}
          </ul>
        ))}

        {tab === 'Products' && (Loading(data.products) ? <ListRowsSkeleton /> : data.products.length === 0 ? <Empty title="No products" /> : (
          <ul className={list}>
            {data.products.map((p) => (
              <li key={p._id} className="flex flex-wrap items-center gap-4 py-3">
                <img src={p.image} alt="" className="h-16 w-12 object-cover" />
                <div className="min-w-0 flex-1">
                  <Link to={`/product/${p._id}`} className="font-display text-xl hover:text-mulberry">{p.name}</Link>
                  <p className="text-sm text-nida-soft">{brandName(p.admin)} · {money(p.price)} · {p.stock} in stock</p>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => delProduct(p)}>Delete</button>
              </li>
            ))}
          </ul>
        ))}

        {tab === 'Customers' && (Loading(data.users) ? <ListRowsSkeleton image={false} /> : data.users.length === 0 ? <Empty title="No customers yet" /> : (
          <ul className={list}>
            {data.users.map((u) => (
              <li key={u._id} className="flex flex-wrap items-center gap-4 py-3 text-sm">
                <div className="min-w-0 flex-1"><p className="font-medium">{u.username}</p><p className="text-nida-soft">{u.email} · joined {dateLabel(u.createdAt)}</p></div>
                <button className="btn btn-danger btn-sm" onClick={() => delUser(u)}>Delete</button>
              </li>
            ))}
          </ul>
        ))}

        {tab === 'Orders' && (Loading(data.orders) ? <OrderCardsSkeleton count={2} /> : data.orders.length === 0 ? <Empty title="No orders yet" /> : (
          <ul className={list}>
            {data.orders.map((o) => (
              <li key={o._id} className="flex flex-wrap items-center gap-4 py-4 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">#{o._id.slice(-6).toUpperCase()} · {o.brandName} → {o.user?.username}</p>
                  <p className="text-nida-soft">{o.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')} · {dateLabel(o.createdAt)}</p>
                </div>
                <StatusBadge status={o.status} />
                <span className="w-28 text-right">{money(o.total)}</span>
                <div className="flex gap-2">
                  {STATUS_FLOW[o.status].map((s) => (
                    <button key={s} className={`btn btn-sm ${s === 'cancelled' ? 'btn-danger' : 'btn-ghost'}`} onClick={() => setStatus(o, s)}>{ORDER_STATUS_LABEL[s]}</button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  )
}
