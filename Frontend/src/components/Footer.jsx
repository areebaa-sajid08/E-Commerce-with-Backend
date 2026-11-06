import { Link } from 'react-router-dom'
import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from '../lib/gsap'
import { SITE_NAME, CATEGORIES } from '../lib/constants'
import { useAuth } from '../context/AuthContext'

export default function Footer() {
  const { user } = useAuth()
  const root = useRef(null)

  useGSAP(() => {
    if (prefersReducedMotion()) return
    gsap.fromTo('[data-wordmark]', { yPercent: 35 }, {
      yPercent: 0, ease: 'none',
      scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom bottom', scrub: true },
    })
    ScrollTrigger.refresh()
  }, { scope: root })

  return (
    <footer ref={root} className="mt-32 overflow-hidden bg-nida text-chiffon">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 pt-20 md:grid-cols-4 md:px-10">
        <div className="md:col-span-2">
          <p className="max-w-sm font-display text-3xl leading-snug">Abayas from independent brands, in one bag.</p>
        </div>
        <div>
          <h3 className="mb-4 font-sans text-sm text-thread">Shop</h3>
          <ul className="space-y-2 text-sm">
            {CATEGORIES.slice(0, 6).map((c) => (
              <li key={c}><Link className="link-line" to={`/shop?category=${encodeURIComponent(c)}`}>{c}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-4 font-sans text-sm text-thread">{SITE_NAME}</h3>
          <ul className="space-y-2 text-sm">
            <li><Link className="link-line" to="/brands">All brands</Link></li>
            {!user && <li><Link className="link-line" to="/register-brand">Sell with us</Link></li>}
            {!user && <li><Link className="link-line" to="/login">Sign in</Link></li>}
            {user && <li><Link className="link-line" to="/orders">Orders</Link></li>}
          </ul>
        </div>
      </div>
      <p data-wordmark className="select-none px-5 pt-16 text-center font-display leading-[0.8] text-chiffon/90 md:px-10" style={{ fontSize: 'clamp(7rem, 26vw, 24rem)' }}>
        {SITE_NAME}
      </p>
      <p className="px-5 pb-6 text-center text-xs text-chiffon/50">© {new Date().getFullYear()} {SITE_NAME}. Payment on delivery across Pakistan.</p>
    </footer>
  )
}
