import { useEffect, useState } from 'react'
import { orderApi } from '../lib/api'
import { useToast } from '../context/ToastContext'
import { money, dateLabel, apiError } from '../lib/format'
import { ORDER_STATUS_LABEL } from '../lib/constants'
import { Empty, PageHead } from '../components/States'
import { OrderCardsSkeleton } from '../components/Skeleton'
import { useRefetchOn } from '../lib/useSocket'

export const statusStyle = {
  pending: 'bg-thread/25 text-nida', confirmed: 'bg-olive/20 text-olive', shipped: 'bg-nida text-chiffon',
  delivered: 'bg-olive text-chiffon', cancelled: 'bg-mulberry/15 text-mulberry',
}

export function StatusBadge({ status }) {
  return <span className={`inline-block px-3 py-1 text-xs font-medium ${statusStyle[status]}`}>{ORDER_STATUS_LABEL[status]}</span>
}

export default function Orders() {
  const [orders, setOrders] = useState(null)
  const toast = useToast()
  const load = () => orderApi.mine().then((r) => setOrders(r.data.orders)).catch(() => setOrders([]))
   
  useEffect(() => { load() }, [])
  useRefetchOn(['order:created', 'order:updated'], load)

  const cancel = async (id) => {
    if (!window.confirm('Cancel this order?')) return
    try { await orderApi.cancel(id); toast('Order cancelled'); load() } catch (err) { toast(apiError(err), 'error') }
  }

  return (
    <div>
      <PageHead title="My orders" />
      <div className="mx-auto max-w-[1000px] px-5 md:px-10">
        {!orders ? <OrderCardsSkeleton /> : orders.length === 0 ? (
          <Empty title="No orders yet" text="Once you place an order, you can follow it here." action={{ to: '/shop', label: 'Browse abayas' }} />
        ) : (
          <ul className="space-y-8">
            {orders.map((o) => (
              <li key={o._id} className="border border-mist bg-chiffon/50 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-2xl">{o.brandName}</p>
                    <p className="text-xs text-nida-soft">Placed {dateLabel(o.createdAt)} · #{o._id.slice(-6).toUpperCase()}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </div>
                <ul className="mt-5 divide-y divide-mist">
                  {o.items.map((it, i) => (
                    <li key={i} className="flex items-center gap-4 py-3">
                      <img src={it.image} alt="" className="h-20 w-14 object-cover" />
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="font-medium">{it.name}</p>
                        <p className="text-nida-soft">{[it.size && `Size ${it.size}`, it.color, `Qty ${it.quantity}`].filter(Boolean).join(' · ')}</p>
                      </div>
                      <span className="text-sm">{money(it.price * it.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap items-end justify-between gap-4 text-sm">
                  <p className="max-w-sm text-nida-soft">{o.shipping.fullName}, {o.shipping.address}, {o.shipping.city}</p>
                  <div className="text-right">
                    <p className="text-nida-soft">Delivery {o.shippingFee ? money(o.shippingFee) : 'free'}</p>
                    <p className="font-display text-3xl">{money(o.total)}</p>
                  </div>
                </div>
                {o.status === 'pending' && <button onClick={() => cancel(o._id)} className="btn btn-danger btn-sm mt-4">Cancel order</button>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
