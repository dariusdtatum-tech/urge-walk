import { useRef } from 'react'

// Swipe a sheet down to close it.
export function useSwipeDown(onClose) {
  const start = useRef(null)
  return {
    onTouchStart: (e) => { start.current = e.touches[0].clientY },
    onTouchEnd: (e) => {
      if (start.current != null && e.changedTouches[0].clientY - start.current > 60) onClose()
      start.current = null
    },
  }
}

// The milestone moment: one calm sheet. Badge, name, days, "That's yours.", Done. Nothing else.
