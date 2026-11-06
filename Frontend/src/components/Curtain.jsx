import { useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import { FABRICS, SITE_NAME } from '../lib/constants'
import { intro } from '../lib/scroll'

const STRIPS = 8

// Pleated fabric panels that lift away. Plays slowly once per session (the opening
// moment) and as a quick wipe on every route change after that.
export default function Curtain() {
  const root = useRef(null)
  const { pathname } = useLocation()

  useGSAP(() => {
    const el = root.current
    if (!el) return
    if (prefersReducedMotion()) {
      intro.pending = false
      gsap.set(el, { display: 'none' })
      return
    }
    const isIntro = intro.pending
    const strips = el.querySelectorAll('[data-strip]')
    const mark = el.querySelector('[data-mark]')

    gsap.set(el, { display: 'flex' })
    gsap.set(strips, { yPercent: 0 })
    gsap.set(mark, { opacity: 0, y: 24 })

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(el, { display: 'none' })
        if (isIntro) {
          intro.pending = false
          sessionStorage.setItem('naqsh-intro', '1')
        }
      },
    })
    if (isIntro) {
      tl.to(mark, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' })
        .to(mark, { opacity: 0, y: -16, duration: 0.45, ease: 'power2.in' }, '+=0.35')
    }
    tl.to(strips, {
      yPercent: -101,
      duration: isIntro ? 1.15 : 0.7,
      ease: 'power4.inOut',
      stagger: { each: isIntro ? 0.08 : 0.04, from: isIntro ? 'center' : 'start' },
    }, isIntro ? '>-0.05' : 0)
  }, { dependencies: [pathname], scope: root })

  return (
    <div ref={root} className="fixed inset-0 z-[100] hidden" aria-hidden="true">
      {Array.from({ length: STRIPS }).map((_, i) => (
        <div
          key={i}
          data-strip
          className="fabric h-full flex-1"
          style={{ '--fabric': FABRICS[i % FABRICS.length], '--pleat': '46px' }}
        />
      ))}
      <div data-mark className="pointer-events-none absolute inset-0 grid place-items-center">
        <span className="font-display text-6xl text-chiffon md:text-8xl">{SITE_NAME}</span>
      </div>
    </div>
  )
}
