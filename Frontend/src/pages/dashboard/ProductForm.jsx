import { useEffect, useMemo, useState } from 'react'
import { productApi } from '../../lib/api'
import { useToast } from '../../context/ToastContext'
import { apiError } from '../../lib/format'
import { CATEGORIES, SIZE_PRESETS } from '../../lib/constants'

const empty = { name: '', desc: '', price: '', comparePrice: '', stock: '', category: 'Everyday', colors: '' }

export default function ProductForm({ product, onClose, onSaved }) {
  const toast = useToast()
  const editing = !!product
  const [form, setForm] = useState(editing ? {
    name: product.name, desc: product.desc, price: product.price, comparePrice: product.comparePrice || '',
    stock: product.stock, category: product.category, colors: (product.colors || []).join(', '),
  } : empty)
  const [sizes, setSizes] = useState(product?.sizes || [])
  const [customSize, setCustomSize] = useState('')
  const [files, setFiles] = useState([])
  const [removeIds, setRemoveIds] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const existing = (product?.images || []).filter((i) => !removeIds.includes(i.fileId))
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])
  useEffect(() => () => previews.forEach(URL.revokeObjectURL), [previews])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const toggleSize = (s) => setSizes((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))
  const addCustom = () => {
    const v = customSize.trim()
    if (v && !sizes.includes(v)) setSizes([...sizes, v])
    setCustomSize('')
  }
  const room = 5 - existing.length

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!editing && files.length === 0) return setError('Add at least one photo.')
    if (existing.length + files.length === 0) return setError('A product needs at least one photo.')

    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => fd.append(k, v))
    fd.append('sizes', sizes.join(','))
    files.slice(0, room).forEach((f) => fd.append('images', f))
    if (removeIds.length) fd.append('removeImageIds', JSON.stringify(removeIds))

    setBusy(true)
    try {
      const res = editing ? await productApi.update(product._id, fd) : await productApi.create(fd)
      toast(editing ? 'Product updated' : 'Product published')
      onSaved(res.data.product)
    } catch (err) { setError(apiError(err)); setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-[80] flex justify-end" role="dialog" aria-modal="true" aria-label={editing ? 'Edit product' : 'Add product'}>
      <div className="absolute inset-0 bg-nida/50" onClick={onClose} />
      <form onSubmit={submit} data-lenis-prevent className="relative h-full w-full max-w-xl overflow-y-auto bg-chiffon p-6 md:p-10">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-4xl">{editing ? 'Edit product' : 'New product'}</h2>
          <button type="button" onClick={onClose} className="text-sm link-line">Close</button>
        </div>

        <div className="space-y-6">
          <label className="block text-sm">Name<input required className="field" value={form.name} onChange={set('name')} /></label>
          <label className="block text-sm">Description<textarea required rows={4} className="field" value={form.desc} onChange={set('desc')} placeholder="Fabric, fit, length, care…" /></label>

          <div className="grid grid-cols-2 gap-6">
            <label className="block text-sm">Price (PKR)<input required type="number" min="0" className="field" value={form.price} onChange={set('price')} /></label>
            <label className="block text-sm">Original price <span className="text-nida-soft">(for sale)</span><input type="number" min="0" className="field" value={form.comparePrice} onChange={set('comparePrice')} /></label>
            <label className="block text-sm">Stock<input required type="number" min="0" step="1" className="field" value={form.stock} onChange={set('stock')} /></label>
            <label className="block text-sm">Cut
              <select className="field" value={form.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
            </label>
          </div>

          <div>
            <p className="mb-2 text-sm">Sizes <span className="text-nida-soft">(length in inches)</span></p>
            <div className="flex flex-wrap gap-2">
              {[...new Set([...SIZE_PRESETS, ...sizes])].map((s) => (
                <button type="button" key={s} onClick={() => toggleSize(s)} aria-pressed={sizes.includes(s)}
                  className={`min-w-12 border px-3 py-1.5 text-sm ${sizes.includes(s) ? 'border-nida bg-nida text-chiffon' : 'border-mist hover:border-nida'}`}>{s}</button>
              ))}
            </div>
            <div className="mt-3 flex gap-3">
              <input className="field" placeholder="Other size, e.g. S or Free size" value={customSize} onChange={(e) => setCustomSize(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }} />
              <button type="button" className="btn btn-ghost btn-sm" onClick={addCustom}>Add</button>
            </div>
          </div>

          <label className="block text-sm">Colours <span className="text-nida-soft">(separate with commas)</span>
            <input className="field" placeholder="Black, Navy, Olive" value={form.colors} onChange={set('colors')} />
          </label>

          <div>
            <p className="mb-2 text-sm">Photos <span className="text-nida-soft">(up to 5, the first is the cover)</span></p>
            <div className="flex flex-wrap gap-3">
              {existing.map((img) => (
                <div key={img.fileId} className="relative h-28 w-20 overflow-hidden bg-dove">
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setRemoveIds([...removeIds, img.fileId])} className="absolute inset-x-0 bottom-0 bg-nida/80 py-1 text-xs text-chiffon">Remove</button>
                </div>
              ))}
              {previews.map((src, i) => (
                <div key={src} className="relative h-28 w-20 overflow-hidden bg-dove">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setFiles(files.filter((_, n) => n !== i))} className="absolute inset-x-0 bottom-0 bg-nida/80 py-1 text-xs text-chiffon">Remove</button>
                </div>
              ))}
            </div>
            {existing.length + files.length < 5 && (
              <input type="file" accept="image/*" multiple className="mt-3 block w-full text-sm file:mr-4 file:border-0 file:bg-nida file:px-4 file:py-2 file:text-chiffon"
                onChange={(e) => { setFiles([...files, ...Array.from(e.target.files)].slice(0, room)); e.target.value = '' }} />
            )}
          </div>

          {error && <p className="text-sm text-mulberry" role="alert">{error}</p>}
          <button className="btn w-full" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Publish product'}</button>
        </div>
      </form>
    </div>
  )
}
