import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { gsap, useGSAP } from '../lib/gsap'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { SITE_NAME } from '../lib/constants'
import { lockScroll, unlockScroll } from '../lib/scroll'

const linkCls = ({ isActive }) => `link-line text-sm ${isActive ? 'active' : ''}`

export default function Navbar() {
  const { user, logout, isBrand, isSuper } = useAuth()
  const { count, setOpen, canShop } = useCart()
  const [menu, setMenu] = useState(false)
  const [search, setSearch] = useState(false)
  const [account, setAccount] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [solid, setSolid] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const lastY = useRef(0)
  const accountRef = useRef(null)

  useEffect(() => {
    setMenu(false); setSearch(false); setAccount(false)
  }, [location.pathname])

  // hide on scroll down, show on scroll up
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setSolid(y > 40)
      setHidden(y > lastY.current && y > 220)
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const close = (e) => { if (accountRef.current && !accountRef.current.contains(e.target)) setAccount(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  useEffect(() => {
    if (menu || search) lockScroll(); else unlockScroll()
    return unlockScroll
  }, [menu, search])

  const doLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${hidden && !menu ? '-translate-y-full' : 'translate-y-0'} ${solid ? 'bg-dove/90 backdrop-blur-md' : ''}`}
      >
        <div className="mx-auto flex h-20 max-w-[1400px] items-center justify-between px-5 md:px-10">
          <Link to="/" className="font-display text-4xl leading-none" aria-label={`${SITE_NAME} home`}>{SITE_NAME}</Link>

          <nav className="hidden items-center gap-10 md:flex" aria-label="Main">
            <NavLink to="/shop" className={linkCls}>Shop</NavLink>
            <NavLink to="/brands" className={linkCls}>Brands</NavLink>
            {!user && <NavLink to="/register-brand" className={linkCls}>Sell with us</NavLink>}
            {isBrand && <NavLink to="/dashboard" className={linkCls}>Dashboard</NavLink>}
            {isSuper && <NavLink to="/admin" className={linkCls}>Admin</NavLink>}
          </nav>

          <div className="flex items-center gap-5">
            <button onClick={() => setSearch(true)} className="text-sm link-line" aria-label="Search">Search</button>

            {user ? (
              <div className="relative hidden md:block" ref={accountRef}>
                <button onClick={() => setAccount((v) => !v)} className="text-sm link-line" aria-expanded={account}>
                  {user.brand?.name || user.username}
                </button>
                {account && (
                  <div className="absolute right-0 top-9 w-48 border border-mist bg-chiffon py-2 text-sm shadow-xl">
                    {canShop && !isBrand && (
                      <>
                        <Link to="/orders" className="block px-4 py-2 hover:bg-dove">My orders</Link>
                        <Link to="/wishlist" className="block px-4 py-2 hover:bg-dove">Saved items</Link>
                      </>
                    )}
                    {isBrand && (
                      <>
                        <Link to="/dashboard" className="block px-4 py-2 hover:bg-dove">Brand dashboard</Link>
                        <Link to="/orders" className="block px-4 py-2 hover:bg-dove">My purchases</Link>
                        <Link to="/wishlist" className="block px-4 py-2 hover:bg-dove">Saved items</Link>
                      </>
                    )}
                    {isSuper && <Link to="/admin" className="block px-4 py-2 hover:bg-dove">Admin panel</Link>}
                    <button onClick={doLogout} className="block w-full px-4 py-2 text-left text-mulberry hover:bg-dove">Sign out</button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="hidden text-sm link-line md:inline">Sign in</Link>
            )}

            {(canShop || !user) && (
              <button
                onClick={() => (user ? setOpen(true) : navigate('/login', { state: { from: location.pathname } }))}
                className="flex items-center gap-2 text-sm link-line"
                aria-label={`Open bag, ${count} items`}
              >
                Bag
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-mulberry px-1 text-[11px] text-chiffon tabular-nums">{count}</span>
              </button>
            )}

            <button className="md:hidden" onClick={() => setMenu(true)} aria-label="Open menu">
              <span className="block h-px w-7 bg-nida" />
              <span className="mt-2 block h-px w-7 bg-nida" />
            </button>
          </div>
        </div>
      </header>

      {menu && (
        <MobileMenu onClose={() => setMenu(false)} user={user} isBrand={isBrand} isSuper={isSuper} canShop={canShop} onLogout={doLogout} />
      )}
      {search && <SearchOverlay onClose={() => setSearch(false)} />}
    </>
  )
}

function MobileMenu({ onClose, user, isBrand, isSuper, canShop, onLogout }) {
  const ref = useRef(null)
  useGSAP(() => {
    gsap.from(ref.current, { yPercent: -100, duration: 0.7, ease: 'power4.out' })
    gsap.from('[data-item]', { yPercent: 120, duration: 0.8, ease: 'power4.out', stagger: 0.06, delay: 0.2 })
  }, { scope: ref })

  const items = [
    ['/shop', 'Shop'],
    ['/brands', 'Brands'],
    ...(user ? [] : [['/register-brand', 'Sell with us'], ['/login', 'Sign in']]),
    ...(canShop ? [['/orders', 'Orders'], ['/wishlist', 'Saved']] : []),
    ...(isBrand ? [['/dashboard', 'Dashboard']] : []),
    ...(isSuper ? [['/admin', 'Admin']] : []),
  ]
  return (
    <div ref={ref} className="fixed inset-0 z-[60] flex flex-col bg-nida px-6 pb-10 pt-6 text-chiffon">
      <button onClick={onClose} className="self-end text-sm" aria-label="Close menu">Close</button>
      <nav className="mt-10 flex flex-1 flex-col gap-3">
        {items.map(([to, label]) => (
          <span key={to} className="mask-line">
            <span data-item><Link to={to} className="font-display text-6xl leading-[1.05]">{label}</Link></span>
          </span>
        ))}
      </nav>
      {user && <button onClick={onLogout} className="self-start text-sm text-thread">Sign out</button>}
    </div>
  )
}

function SearchOverlay({ onClose }) {
  const [q, setQ] = useState('')
  const ref = useRef(null)
  const navigate = useNavigate()
  useGSAP(() => {
    gsap.from(ref.current, { opacity: 0, duration: 0.3 })
    gsap.from('[data-input]', { yPercent: 40, opacity: 0, duration: 0.6, ease: 'power3.out', delay: 0.1 })
  }, { scope: ref })
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submit = (e) => {
    e.preventDefault()
    navigate(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : '/shop')
  }
  return (
    <div ref={ref} className="fixed inset-0 z-[60] bg-dove/95 px-5 pt-6 backdrop-blur-md md:px-10">
      <div className="mx-auto max-w-[1400px]">
        <button onClick={onClose} className="ml-auto block text-sm">Close</button>
        <form onSubmit={submit} className="mt-24 md:mt-40" data-input>
          <label htmlFor="site-search" className="text-sm text-nida-soft">What are you looking for?</label>
          <input
            id="site-search" autoFocus value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Black nida, embroidered cuffs…"
            className="mt-2 w-full border-b border-nida bg-transparent pb-4 font-display text-4xl placeholder:text-nida/25 focus:outline-none md:text-7xl"
          />
          <button className="btn mt-8" type="submit">Search</button>
        </form>
      </div>
    </div>
  )
}
