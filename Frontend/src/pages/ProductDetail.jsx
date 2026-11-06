import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import { productApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { money, brandName, apiError, dateLabel } from '../lib/format'
import { useSocketEvent, useRefetchOn } from '../lib/useSocket'
import { ProductDetailSkeleton } from '../components/Skeleton'
import Fabric from '../components/Fabric'
import Stars from '../components/Stars'
import QtyStepper from '../components/QtyStepper'
import { Heart } from '../components/ProductCard'
import NotFound from './NotFound'

export default function ProductDetail() {
  const { id } = useParams()
  const { user, isSuper } = useAuth()
  const { add, busy, wishIds, toggleWish, canShop } = useCart()
  const toast = useToast()
  const navigate = useNavigate()
  const root = useRef(null)
  const mainImg = useRef(null)

  const [product, setProduct] = useState(null)
  const [missing, setMissing] = useState(false)
  const [reviews, setReviews] = useState([])
  const [active, setActive] = useState(0)
  const [size, setSize] = useState('')
  const [color, setColor] = useState('')
  const [qty, setQty] = useState(1)
  const [error, setError] = useState('')

  const loadAll = () => {
    productApi.one(id).then((r) => setProduct(r.data.product)).catch(() => setMissing(true))
    productApi.reviews(id).then((r) => setReviews(r.data.reviews)).catch(() => {})
  }
  useEffect(() => {
    setProduct(null); setMissing(false); setActive(0); setSize(''); setColor(''); setQty(1); setError('')
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  // live: price / stock / rating edits, deletion, new reviews
  useSocketEvent('product:updated', (p) => { if (p._id === id) setProduct(p) })
  useSocketEvent('product:deleted', ({ id: gone }) => {
    if (gone === id) { setMissing(true); toast('This product was just removed.', 'error') }
  })
  useSocketEvent('review:changed', ({ productId }) => {
    if (productId === id) productApi.reviews(id).then((r) => setReviews(r.data.reviews)).catch(() => {})
  })
  useRefetchOn([], loadAll) // after a dropped connection comes back

  useGSAP(() => {
    if (!product || prefersReducedMotion()) return
    gsap.from('[data-arch]', { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.3, ease: 'power4.out' })
    gsap.from('[data-info] > *', { y: 28, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07, delay: 0.25 })
  }, { scope: root, dependencies: [product?._id] })

  const switchImage = (i) => {
    if (i === active) return
    gsap.to(mainImg.current, { opacity: 0, duration: 0.2, onComplete: () => {
      setActive(i)
      gsap.to(mainImg.current, { opacity: 1, duration: 0.35 })
    } })
  }

  if (missing) return <NotFound />
  if (!product) return <ProductDetailSkeleton />

  const images = product.images?.length ? product.images : (product.image ? [{ url: product.image }] : [])
  const shown = images[Math.min(active, images.length - 1)]
  const soldOut = product.stock < 1
  const onSale = product.comparePrice > product.price
  const isOwner = user && product.admin?._id === user._id
  const wished = wishIds.includes(product._id)

  const addToBag = async () => {
    setError('')
    if (!user) return navigate('/login', { state: { from: `/product/${id}` } })
    if (product.sizes.length && !size) return setError('Choose a size first.')
    if (product.colors.length && !color) return setError('Choose a colour first.')
    await add({ productId: product._id, quantity: qty, size, color })
  }

  const removeProduct = async () => {
    if (!window.confirm(`Delete “${product.name}” permanently?`)) return
    try {
      await productApi.remove(product._id)
      toast('Product deleted')
      navigate('/shop')
    } catch (err) { toast(apiError(err), 'error') }
  }

  const pill = (selected) => `min-w-12 border px-4 py-2 text-sm transition-colors ${selected ? 'border-nida bg-nida text-chiffon' : 'border-mist hover:border-nida'}`

  return (
    <div ref={root} className="mx-auto max-w-[1400px] px-5 pt-28 md:px-10">
      <nav className="mb-8 text-sm text-nida-soft" aria-label="Breadcrumb">
        <Link to="/shop" className="link-line">Shop</Link> / <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="link-line">{product.category}</Link>
      </nav>

      <div className="grid gap-10 md:grid-cols-[1.1fr_1fr] md:gap-20">
        <div className="flex gap-4">
          {images.length > 1 && (
            <div className="flex flex-col gap-3">
              {images.map((img, i) => (
                <button key={img.url} onClick={() => switchImage(i)} className={`h-20 w-16 overflow-hidden border-b-2 ${i === active ? 'border-mulberry' : 'border-transparent opacity-60 hover:opacity-100'}`} aria-label={`Show image ${i + 1}`}>
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          <div data-arch className="arch aspect-[3/4.2] flex-1 overflow-hidden bg-chiffon">
            {shown ? <img ref={mainImg} src={shown.url} alt={product.name} className="h-full w-full object-cover" /> : <Fabric className="h-full w-full" />}
          </div>
        </div>

        <div data-info className="md:sticky md:top-28 md:self-start">
          <Link to={`/brands/${product.admin?._id}`} className="link-line text-sm">{brandName(product.admin)}</Link>
          <h1 className="mt-2 text-5xl leading-[1.02] md:text-7xl">{product.name}</h1>
          {product.ratingCount > 0 && <div className="mt-4"><Stars value={product.ratingAvg} count={product.ratingCount} /></div>}

          <p className="mt-6 flex items-baseline gap-4">
            <span className="font-display text-4xl">{money(product.price)}</span>
            {onSale && <span className="text-nida-soft line-through">{money(product.comparePrice)}</span>}
          </p>
          <p className="mt-6 max-w-prose whitespace-pre-line text-nida-soft">{product.desc}</p>

          {product.sizes.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 text-sm font-medium">Size {size && <span className="font-normal text-nida-soft">· {size}</span>}</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => <button key={s} className={pill(size === s)} onClick={() => setSize(s)} aria-pressed={size === s}>{s}</button>)}
              </div>
            </div>
          )}
          {product.colors.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-sm font-medium">Colour {color && <span className="font-normal text-nida-soft">· {color}</span>}</p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => <button key={c} className={pill(color === c)} onClick={() => setColor(c)} aria-pressed={color === c}>{c}</button>)}
              </div>
            </div>
          )}

          {error && <p className="mt-5 text-sm text-mulberry" role="alert">{error}</p>}

          {isSuper ? (
            <button className="btn btn-danger mt-8" onClick={removeProduct}>Delete this product</button>
          ) : isOwner ? (
            <div className="mt-8 border border-mist p-4 text-sm">
              This is your listing. <Link to="/dashboard" className="underline underline-offset-4">Edit it in your dashboard</Link>.
            </div>
          ) : (
            <div className="mt-8 flex flex-wrap items-center gap-4">
              {!soldOut && <QtyStepper value={qty} max={product.stock} onChange={setQty} />}
              <button className="btn min-w-48 flex-1" onClick={addToBag} disabled={soldOut || busy}>
                {soldOut ? 'Sold out' : busy ? 'Adding…' : 'Add to bag'}
              </button>
              {canShop && (
                <button onClick={() => toggleWish(product._id)} className={`grid h-12 w-12 place-items-center border ${wished ? 'border-mulberry text-mulberry' : 'border-mist hover:border-nida'}`} aria-pressed={wished} aria-label={wished ? 'Remove from saved' : 'Save for later'}>
                  <Heart active={wished} />
                </button>
              )}
            </div>
          )}
          {!soldOut && product.stock <= 5 && <p className="mt-4 text-sm text-mulberry">Only {product.stock} left.</p>}
          <p className="mt-8 text-sm text-nida-soft">Cash on delivery. Ships from {brandName(product.admin)}.</p>
        </div>
      </div>

      <Reviews productId={product._id} reviews={reviews} onChange={loadAll} canReview={canShop && !isOwner} user={user} isSuper={isSuper} />
    </div>
  )
}

function Reviews({ productId, reviews, onChange, canReview, user, isSuper }) {
  const toast = useToast()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!rating) return toast('Pick a star rating first', 'error')
    setSaving(true)
    try {
      await productApi.addReview(productId, { rating, comment })
      toast('Thanks for your review')
      setRating(0); setComment('')
      onChange()
    } catch (err) { toast(apiError(err), 'error') } finally { setSaving(false) }
  }
  const del = async (rid) => {
    try { await productApi.deleteReview(productId, rid); onChange() } catch (err) { toast(apiError(err), 'error') }
  }

  return (
    <section className="mt-28 grid gap-12 border-t border-mist pt-14 md:grid-cols-[1fr_1.4fr]">
      <div>
        <h2 className="text-4xl md:text-5xl">Reviews</h2>
        {canReview && (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="flex gap-1" role="radiogroup" aria-label="Your rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button type="button" key={n} onClick={() => setRating(n)} role="radio" aria-checked={rating === n} aria-label={`${n} stars`} className={`text-3xl leading-none ${n <= rating ? 'text-thread' : 'text-mist'}`}>★</button>
              ))}
            </div>
            <textarea className="field" rows={3} placeholder="How did it fit and feel?" value={comment} onChange={(e) => setComment(e.target.value)} />
            <button className="btn btn-sm" disabled={saving}>{saving ? 'Saving…' : 'Post review'}</button>
          </form>
        )}
        {!user && <p className="mt-6 text-sm text-nida-soft"><Link className="underline underline-offset-4" to="/login">Sign in</Link> to leave a review.</p>}
      </div>
      <ul className="divide-y divide-mist">
        {reviews.length === 0 && <li className="py-4 text-nida-soft">No reviews yet.</li>}
        {reviews.map((r) => (
          <li key={r._id} className="py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3"><Stars value={r.rating} /><span className="text-sm font-medium">{r.user?.username}</span></div>
              <span className="text-xs text-nida-soft">{dateLabel(r.createdAt)}</span>
            </div>
            {r.comment && <p className="mt-2 text-nida-soft">{r.comment}</p>}
            {(isSuper || r.user?._id === user?._id) && <button onClick={() => del(r._id)} className="mt-2 text-xs text-mulberry underline underline-offset-4">Delete</button>}
          </li>
        ))}
      </ul>
    </section>
  )
}
