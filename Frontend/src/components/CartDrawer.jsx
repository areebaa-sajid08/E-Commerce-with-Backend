import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { gsap, useGSAP } from '../lib/gsap'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { money, brandName } from '../lib/format'
import { lockScroll, unlockScroll } from '../lib/scroll'
import Fabric from './Fabric'
import QtyStepper from './QtyStepper'
import { CartLinesSkeleton } from './Skeleton'

export default function CartDrawer() {
  const { open, setOpen, items, subtotal, count, setQty, remove, busy, ready } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const root = useRef(null)
  const panel = useRef(null)
  const tl = useRef(null)

  useGSAP(() => {
    gsap.set(root.current, { visibility: 'hidden' })
    gsap.set(panel.current, { xPercent: 100 })
    tl.current = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } })
      .set(root.current, { visibility: 'visible' })
      .to('[data-backdrop]', { opacity: 1, duration: 0.35 }, 0)
      .to(panel.current, { xPercent: 0, duration: 0.6, ease: 'power4.out' }, 0)
  }, { scope: root })

  useEffect(() => {
    if (!tl.current) return
    if (open) { tl.current.play(); lockScroll() } else { tl.current.reverse(); unlockScroll() }
    return unlockScroll
  }, [open])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setOpen])

  const go = (to) => { setOpen(false); navigate(to) }

  return (
    <div ref={root} className="fixed inset-0 z-[70]" aria-hidden={!open} inert={!open}>
      <div data-backdrop className="absolute inset-0 bg-nida/50 opacity-0" onClick={() => setOpen(false)} />
      <aside ref={panel} className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-chiffon" aria-label="Shopping bag">
        <div className="flex items-center justify-between border-b border-mist px-6 py-5">
          <h2 className="text-3xl">Your bag <span className="text-lg text-nida-soft">({count})</span></h2>
          <button onClick={() => setOpen(false)} className="text-sm link-line">Close</button>
        </div>

        {!user ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
            <p className="text-nida-soft">Sign in to save pieces to your bag.</p>
            <button className="btn" onClick={() => go('/login')}>Sign in</button>
          </div>
        ) : !ready ? (
          <div className="flex-1 overflow-hidden"><CartLinesSkeleton compact /></div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
            <p className="font-display text-3xl">Nothing here yet</p>
            <p className="text-nida-soft">Pieces you add will wait for you here.</p>
            <button className="btn" onClick={() => go('/shop')}>Browse abayas</button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-mist overflow-y-auto px-6" data-lenis-prevent>
              {items.map((it, i) => (
                <li key={it._id} className="flex gap-4 py-5">
                  <Link to={`/product/${it.product._id}`} onClick={() => setOpen(false)} className="block h-28 w-20 shrink-0 overflow-hidden bg-dove">
                    {it.product.image ? <img src={it.product.image} alt={it.product.name} className="h-full w-full object-cover" /> : <Fabric seed={i} className="h-full w-full" />}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="text-xs text-nida-soft">{brandName(it.product.admin)}</p>
                    <p className="truncate font-display text-xl leading-tight">{it.product.name}</p>
                    <p className="mt-0.5 text-xs text-nida-soft">
                      {[it.size && `Size ${it.size}`, it.color].filter(Boolean).join(' · ')}
                    </p>
                    {!it.available && <p className="mt-1 text-xs text-mulberry">Only {it.product.stock} left. Reduce the quantity.</p>}
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <QtyStepper value={it.quantity} max={Math.max(it.product.stock, 1)} disabled={busy} onChange={(q) => setQty(it._id, q)} />
                      <div className="text-right">
                        <p className="text-sm font-medium">{money(it.lineTotal)}</p>
                        <button onClick={() => remove(it._id)} disabled={busy} className="text-xs text-mulberry underline underline-offset-4">Remove</button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="border-t border-mist px-6 py-5">
              <div className="flex items-baseline justify-between">
                <span>Subtotal</span>
                <span className="font-display text-3xl">{money(subtotal)}</span>
              </div>
              <p className="mt-1 text-xs text-nida-soft">Delivery is worked out at checkout. Each brand ships its own items.</p>
              <button className="btn mt-5 w-full" onClick={() => go('/checkout')}>Checkout</button>
              <button className="btn btn-ghost mt-3 w-full" onClick={() => go('/cart')}>View full bag</button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
