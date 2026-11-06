import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { cartApi, wishlistApi } from '../lib/api'
import { apiError } from '../lib/format'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'
import { useSocketEvent, useRefetchOn } from '../lib/useSocket'

const CartContext = createContext(null)
export const useCart = () => useContext(CartContext)

const EMPTY = { cart: [], summary: { count: 0, subtotal: 0, shipping: 0, total: 0, parcels: 0 } }

export function CartProvider({ children }) {
  const { user } = useAuth()
  const toast = useToast()
  const [data, setData] = useState(EMPTY)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [wishIds, setWishIds] = useState([])
  const [ready, setReady] = useState(false)

  const canShop = !!user && user.role !== 'superadmin'

  useEffect(() => {
    if (!canShop) {
      setData(EMPTY)
      setWishIds([])
      setReady(true)
      return
    }
    setReady(false)
    cartApi.get().then((r) => setData(r.data)).catch(() => {}).finally(() => setReady(true))
    wishlistApi.get().then((r) => setWishIds(r.data.wishlist.map((p) => p._id))).catch(() => {})
  }, [canShop, user?._id])

  // live: other tabs/devices, price or stock changes, deleted products
  useSocketEvent('cart:updated', (payload) => { if (canShop) setData({ cart: payload.cart, summary: payload.summary }) })
  useSocketEvent('wishlist:updated', ({ ids }) => { if (canShop) setWishIds(ids) })
  useRefetchOn('cart:refresh', () => { if (canShop) cartApi.get().then((r) => setData(r.data)).catch(() => {}) }, 200)
  useRefetchOn('wishlist:refresh', () => {
    if (canShop) wishlistApi.get().then((r) => setWishIds(r.data.wishlist.map((p) => p._id))).catch(() => {})
  }, 200)

  const run = useCallback(async (fn, okMessage) => {
    setBusy(true)
    try {
      const res = await fn()
      setData({ cart: res.data.cart, summary: res.data.summary })
      if (okMessage) toast(okMessage)
      return true
    } catch (err) {
      toast(apiError(err), 'error')
      return false
    } finally {
      setBusy(false)
    }
  }, [toast])

  const add = useCallback(async (payload) => {
    const ok = await run(() => cartApi.add(payload))
    if (ok) setOpen(true)
    return ok
  }, [run])

  const setQty = useCallback((itemId, qty) => run(() => cartApi.setQty(itemId, qty)), [run])
  const remove = useCallback((itemId) => run(() => cartApi.remove(itemId), 'Removed from cart'), [run])
  const clear = useCallback(async () => {
    await cartApi.clear().catch(() => {})
    setData(EMPTY)
  }, [])

  const toggleWish = useCallback(async (productId) => {
    const has = wishIds.includes(productId)
    setWishIds((ids) => (has ? ids.filter((i) => i !== productId) : [...ids, productId]))
    try {
      if (has) await wishlistApi.remove(productId)
      else await wishlistApi.add(productId)
    } catch (err) {
      setWishIds((ids) => (has ? [...ids, productId] : ids.filter((i) => i !== productId)))
      toast(apiError(err), 'error')
    }
  }, [wishIds, toast])

  return (
    <CartContext.Provider value={{
      items: data.cart, count: data.summary.count, subtotal: data.summary.subtotal,
      shipping: data.summary.shipping, total: data.summary.total, parcels: data.summary.parcels,
      freeShippingAbove: data.summary.freeShippingAbove, refreshCart: () => cartApi.get().then((r) => setData(r.data)),
      ready, open, setOpen, busy, add, setQty, remove, clear,
      wishIds, toggleWish, canShop,
    }}>
      {children}
    </CartContext.Provider>
  )
}
