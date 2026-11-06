import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { apiError } from '../lib/format'
import { SITE_NAME } from '../lib/constants'
import GoogleButton, { OrDivider } from '../components/GoogleButton'

function AuthShell({ title, sub, fabric, children, footer }) {
  const root = useRef(null)
  useGSAP(() => {
    if (prefersReducedMotion()) return
    gsap.from('[data-form] > *', { y: 24, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.06, delay: 0.5 })
  }, { scope: root })

  return (
    <div ref={root} className="grid min-h-[100svh] md:grid-cols-[1fr_1.1fr]">
      <div data-fabric className="fabric hidden items-end p-10 md:flex" style={{ '--fabric': fabric, '--pleat': '130px' }}>
        <p className="max-w-xs font-display text-5xl leading-[1.05] text-chiffon">{SITE_NAME}</p>
      </div>
      <div className="flex items-center px-5 pb-16 pt-32 md:px-16">
        <div data-form className="mx-auto w-full max-w-md">
          <h1 className="text-5xl md:text-6xl">{title}</h1>
          {sub && <p className="mt-3 text-nida-soft">{sub}</p>}
          <div className="mt-10">{children}</div>
          <div className="mt-8 text-sm text-nida-soft">{footer}</div>
        </div>
      </div>
    </div>
  )
}

const GOOGLE_ERRORS = {
  google_failed: 'Google sign-in didn’t complete. Please try again.',
  google_unavailable: 'Google sign-in isn’t set up on this server yet.',
}

const dest = (user, from) => (from || (user.role === 'admin' ? '/dashboard' : user.role === 'superadmin' ? '/admin' : '/'))

export function Login() {
  const { login } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const { state } = useLocation()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [params] = useSearchParams()
  const [error, setError] = useState(GOOGLE_ERRORS[params.get('error')] || '')

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      const user = await login(form)
      toast(`Welcome back, ${user.brand?.name || user.username}`)
      navigate(dest(user, state?.from), { replace: true })
    } catch (err) { setError(apiError(err)); setBusy(false) }
  }

  return (
    <AuthShell title="Sign in" sub="Customers, brands and the admin all sign in here." fabric="#1D2838"
      footer={<>New here? <Link to="/register" className="text-nida underline underline-offset-4">Create an account</Link> or <Link to="/register-brand" className="text-nida underline underline-offset-4">open a brand shop</Link>.</>}>
      <GoogleButton />
      <OrDivider />
      <form onSubmit={submit} className="space-y-6">
        <label className="block text-sm">Email or username<input required autoFocus className="field" value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} autoComplete="username" /></label>
        <label className="block text-sm">Password<input required type="password" className="field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" /></label>
        {error && <p className="text-sm text-mulberry" role="alert">{error}</p>}
        <button className="btn w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </AuthShell>
  )
}

export function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      await register(form)
      navigate(state?.from || '/', { replace: true })
    } catch (err) { setError(apiError(err)); setBusy(false) }
  }

  return (
    <AuthShell title="Create account" sub="Save pieces, check out faster, follow your orders." fabric="#7B2D4B"
      footer={<>Already have an account? <Link to="/login" className="text-nida underline underline-offset-4">Sign in</Link>.</>}>
      <GoogleButton label="Sign up with Google" />
      <OrDivider />
      <form onSubmit={submit} className="space-y-6">
        <label className="block text-sm">Username<input required minLength={3} className="field" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} autoComplete="username" /></label>
        <label className="block text-sm">Email<input required type="email" className="field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" /></label>
        <label className="block text-sm">Password <span className="text-nida-soft">(6+ characters)</span><input required minLength={6} type="password" className="field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" /></label>
        {error && <p className="text-sm text-mulberry" role="alert">{error}</p>}
        <button className="btn w-full" disabled={busy}>{busy ? 'Creating…' : 'Create account'}</button>
      </form>
    </AuthShell>
  )
}

export function RegisterBrand() {
  const { registerBrand } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ brandName: '', description: '', username: '', email: '', password: '' })
  const [logo, setLogo] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    if (logo) fd.append('logo', logo)
    try {
      await registerBrand(fd)
      navigate('/dashboard', { replace: true })
    } catch (err) { setError(apiError(err)); setBusy(false) }
  }

  return (
    <AuthShell title="Open your shop" sub="List your abayas, set your prices and manage orders from your own dashboard." fabric="#69724F"
      footer={<>Shopping instead? <Link to="/register" className="text-nida underline underline-offset-4">Create a customer account</Link>.</>}>
      <form onSubmit={submit} className="space-y-6">
        <label className="block text-sm">Brand name<input required className="field" value={form.brandName} onChange={set('brandName')} /></label>
        <label className="block text-sm">About your brand <span className="text-nida-soft">(optional)</span><textarea rows={2} className="field" value={form.description} onChange={set('description')} /></label>
        <label className="block text-sm">Logo <span className="text-nida-soft">(optional)</span>
          <input type="file" accept="image/*" className="mt-2 block w-full text-sm file:mr-4 file:border-0 file:bg-nida file:px-4 file:py-2 file:text-chiffon" onChange={(e) => setLogo(e.target.files?.[0] || null)} />
        </label>
        <div className="grid gap-6 md:grid-cols-2">
          <label className="block text-sm">Username<input required minLength={3} className="field" value={form.username} onChange={set('username')} autoComplete="username" /></label>
          <label className="block text-sm">Email<input required type="email" className="field" value={form.email} onChange={set('email')} autoComplete="email" /></label>
        </div>
        <label className="block text-sm">Password <span className="text-nida-soft">(6+ characters)</span><input required minLength={6} type="password" className="field" value={form.password} onChange={set('password')} autoComplete="new-password" /></label>
        {error && <p className="text-sm text-mulberry" role="alert">{error}</p>}
        <button className="btn w-full" disabled={busy}>{busy ? 'Creating shop…' : 'Open shop'}</button>
      </form>
    </AuthShell>
  )
}

// Landing page after Google redirects back. The backend has already set the login cookie.
export function GoogleDone() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  useEffect(() => {
    if (loading) return
    if (!user) return navigate('/login?error=google_failed', { replace: true })
    const from = sessionStorage.getItem('naqsh-after-login')
    sessionStorage.removeItem('naqsh-after-login')
    navigate(dest(user, from), { replace: true })
  }, [user, loading, navigate])
  return <div className="grid min-h-[100svh] place-items-center text-nida-soft">Signing you in…</div>
}
