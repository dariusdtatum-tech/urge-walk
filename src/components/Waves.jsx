import { useEffect, useState } from 'react'

// Three layered swells (sand, foam, sea glass) and a thin foam line at the bottom of the screen,
// behind the content and the tab bar. Each layer drifts sideways very slowly (14–22s), never
// vertically. Still under prefers-reduced-motion, and paused while the app is in the background.
function Waves() {
  const [hidden, setHidden] = useState(() => typeof document !== 'undefined' && document.hidden)
  useEffect(() => {
    const onChange = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])
  return (
    <div className={hidden ? 'waves waves-paused' : 'waves'} aria-hidden="true" data-testid="waves">
      <svg viewBox="0 0 390 190" preserveAspectRatio="none" focusable="false">
        <path className="wave wave-1" d="M0 78 C 70 58 130 96 200 80 C 270 64 320 86 390 70 L390 190 L0 190Z" />
        <path className="wave wave-2" d="M0 108 C 80 92 150 124 220 108 C 290 94 340 112 390 100 L390 190 L0 190Z" />
        <path className="wave wave-3" d="M0 140 C 90 126 160 152 240 138 C 310 126 350 142 390 134 L390 190 L0 190Z" />
        <path className="wave wave-foam" d="M0 108 C 80 92 150 124 220 108 C 290 94 340 112 390 100" />
      </svg>
    </div>
  )
}

export default Waves
