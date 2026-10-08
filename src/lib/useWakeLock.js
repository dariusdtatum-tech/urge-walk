import { useEffect } from 'react'

// Keeps the screen on while `active` is true, where the browser supports it
// (Screen Wake Lock API; iOS 16.4+ in Safari / Home Screen apps). Fails silently.
export function useWakeLock(active) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return undefined
    let lock = null
    let cancelled = false

    async function acquire() {
      try {
        if (document.visibilityState !== 'visible') return
        const l = await navigator.wakeLock.request('screen')
        if (cancelled) l.release().catch(() => {})
        else lock = l
      } catch {
        // not allowed right now (e.g. low battery mode) — that's fine
      }
    }
    // The lock is dropped whenever the app is hidden, so take it again on return.
    const onVisible = () => { if (document.visibilityState === 'visible') acquire() }

    acquire()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      if (lock) lock.release().catch(() => {})
    }
  }, [active])
}
