import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useSocketEvent } from '../lib/useSocket'
import { money } from '../lib/format'

// Small pop-ups for things that happen while you are on the site.
export default function RealtimeToasts() {
  const { user } = useAuth()
  const toast = useToast()

  useSocketEvent('order:created', (order) => {
    if (user?.role === 'admin' && order.brand === user._id) {
      toast(`New order from ${order.shipping?.fullName}: ${money(order.total)}`)
    }
  })

  useSocketEvent('order:updated', (order) => {
    if (user && order.user === user._id) {
      toast(`Your order from ${order.brandName} is now ${order.status}.`)
    }
  })

  return null
}
