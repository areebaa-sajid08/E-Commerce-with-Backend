import { Link, useNavigate } from 'react-router-dom'
import Fabric from './Fabric'
import { money, brandName } from '../lib/format'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

export function Heart({ active, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 ${className}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M12 20.5s-7.5-4.6-7.5-10.3A4.2 4.2 0 0 1 12 7.8a4.2 4.2 0 0 1 7.5 2.4c0 5.7-7.5 10.3-7.5 10.3Z" />
    </svg>
  )
}

export default function ProductCard({ product, index = 0, offset = false }) {
  const { wishIds, toggleWish, canShop } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const wished = wishIds.includes(product._id)
  const soldOut = product.stock < 1
  const onSale = product.comparePrice > product.price
  const second = product.images?.[1]?.url

  const onHeart = (e) => {
    e.preventDefault()
    if (!user) return navigate('/login', { state: { from: `/product/${product._id}` } })
    if (canShop) toggleWish(product._id)
  }

  return (
    <article className={offset ? 'md:mt-16' : ''}>
      <Link to={`/product/${product._id}`} className="group block">
        <div data-parallax className="relative aspect-[3/4] overflow-hidden bg-chiffon">
          {product.image ? (
            <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <Fabric seed={index} className="h-full w-full" />
          )}
          {second && (
            <img src={second} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          )}
          {(onSale || soldOut) && (
            <span className={`absolute left-0 top-4 px-3 py-1 text-xs font-medium ${soldOut ? 'bg-nida text-chiffon' : 'bg-mulberry text-chiffon'}`}>
              {soldOut ? 'Sold out' : 'Sale'}
            </span>
          )}
        </div>
        <div className="mt-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm text-nida-soft">{brandName(product.admin)}</p>
            <h3 className="mt-0.5 truncate text-2xl leading-tight transition-colors group-hover:text-mulberry">{product.name}</h3>
          </div>
          <div className="shrink-0 text-right text-sm">
            <p className="font-medium">{money(product.price)}</p>
            {onSale && <p className="text-nida-soft line-through">{money(product.comparePrice)}</p>}
          </div>
        </div>
      </Link>
      {canShop && (
        <button
          onClick={onHeart}
          className={`mt-2 inline-flex items-center gap-2 text-sm transition-colors ${wished ? 'text-mulberry' : 'text-nida-soft hover:text-mulberry'}`}
          aria-pressed={wished}
        >
          <Heart active={wished} /> {wished ? 'Saved' : 'Save'}
        </button>
      )}
    </article>
  )
}
