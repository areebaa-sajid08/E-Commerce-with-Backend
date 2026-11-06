import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Subtle image parallax: the first child of [data-parallax] drifts inside its mask.
export function parallaxAll(scope) {
  if (!scope || prefersReducedMotion()) return
  scope.querySelectorAll('[data-parallax]').forEach((el) => {
    const img = el.firstElementChild
    if (!img) return
    gsap.fromTo(
      img,
      { yPercent: -7, scale: 1.14 },
      {
        yPercent: 7, scale: 1.14, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      }
    )
  })
}

export { gsap, ScrollTrigger, useGSAP }
