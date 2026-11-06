import { Link } from 'react-router-dom'

export function Spinner({ label = 'Loading' }) {
  return (
    <div className="grid min-h-[40vh] place-items-center" role="status" aria-label={label}>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-mist border-t-mulberry" />
    </div>
  )
}

export function Empty({ title, text, action }) {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h3 className="text-3xl">{title}</h3>
      {text && <p className="mt-3 text-nida-soft">{text}</p>}
      {action && (
        <Link to={action.to} className="btn mt-8">{action.label}</Link>
      )}
    </div>
  )
}

export function PageHead({ title, sub, children }) {
  return (
    <header className="mx-auto flex max-w-[1400px] flex-wrap items-end justify-between gap-6 px-5 pb-10 pt-36 md:px-10">
      <div>
        <h1 className="text-5xl md:text-7xl">{title}</h1>
        {sub && <p className="mt-4 max-w-xl text-nida-soft">{sub}</p>}
      </div>
      {children}
    </header>
  )
}
