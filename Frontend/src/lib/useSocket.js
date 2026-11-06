import { useEffect, useRef } from 'react'
import { socket } from './socket'

// Run `handler(payload)` whenever the server pushes one of `events`.
export function useSocketEvent(events, handler) {
  const ref = useRef(handler)
  useEffect(() => { ref.current = handler })
  const list = [].concat(events)
  const key = list.join('|')
  useEffect(() => {
    const fn = (...args) => ref.current(...args)
    list.forEach((e) => socket.on(e, fn))
    return () => list.forEach((e) => socket.off(e, fn))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
}

// Re-run a loader when any of `events` arrives, and again after a dropped connection comes back,
// so a page never stays stale. Bursts of events are collapsed into one call.
export function useRefetchOn(events, loader, wait = 350) {
  const ref = useRef(loader)
  useEffect(() => { ref.current = loader })
  const key = [].concat(events).join('|')
  useEffect(() => {
    let timer
    const run = () => {
      clearTimeout(timer)
      timer = setTimeout(() => ref.current(), wait)
    }
    const list = [].concat(events)
    list.forEach((e) => socket.on(e, run))
    socket.io.on('reconnect', run)
    return () => {
      clearTimeout(timer)
      list.forEach((e) => socket.off(e, run))
      socket.io.off('reconnect', run)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, wait])
}
