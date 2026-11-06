import { createContext, useCallback, useContext, useRef, useState } from 'react'
import gsap from 'gsap'

const ToastContext = createContext(null)
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const toast = useCallback((message, type = 'ok') => {
    const id = ++idRef.current
    setToasts((t) => [...t.slice(-2), { id, message, type }])
    setTimeout(() => dismiss(id), 3800)
  }, [dismiss])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed bottom-5 left-5 z-90 flex flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => <ToastItem key={t.id} toast={t} />)}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast }) {
  const ref = useRef(null)
  return (
    <div
      ref={(el) => {
        if (el && !ref.current) {
          ref.current = el
          gsap.fromTo(el, { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, ease: 'power3.out' })
        }
      }}
      className={`pointer-events-auto max-w-sm border-l-4 px-4 py-3 text-sm shadow-lg ${
        toast.type === 'error' ? 'border-mulberry bg-chiffon text-mulberry' : 'border-thread bg-nida text-chiffon'
      }`}
    >
      {toast.message}
    </div>
  )
}
