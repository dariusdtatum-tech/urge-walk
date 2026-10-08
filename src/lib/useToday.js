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
