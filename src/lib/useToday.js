import { useEffect, useState } from 'react'
import { todayISO } from './cleanTime.js'

// Returns today's local date ('YYYY-MM-DD') and updates it after midnight,
// or when the app comes back to the foreground (iOS pauses apps in the background).
export function useToday() {
  const [today, setToday] = useState(() => todayISO())

  useEffect(() => {
    const refresh = () => setToday(todayISO())
    const timer = setInterval(refresh, 60 * 1000)
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  return today
}

// The current time (ms), refreshed every minute and when the app comes back to the foreground.
// Used by Home for "today" / "this week" ranges without calling Date.now() during render.
export function useNow() {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const refresh = () => setNow(Date.now())
    const timer = setInterval(refresh, 60 * 1000)
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  return now
}

// The current time, updated exactly on each minute boundary (for clean time: days and hours,
// no seconds, so once a minute is plenty), and when the app comes back to the foreground.
export function useMinuteNow() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    let timer
    const tick = () => {
      setNow(Date.now())
      timer = setTimeout(tick, 60_000 - (Date.now() % 60_000))
    }
    timer = setTimeout(tick, 60_000 - (Date.now() % 60_000))
    const refresh = () => setNow(Date.now())
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])
  return now
}
