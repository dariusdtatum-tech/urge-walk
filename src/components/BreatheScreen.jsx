import { useEffect, useState } from 'react'
import { useWakeLock } from '../lib/useWakeLock.js'
import { breathPhase } from '../lib/breathe.js'
import { BREATHE_SECONDS } from '../lib/walkStorage.js'
import WalkFinish from './WalkFinish.jsx'

// Breathe: focus mode (no header or tab bar). A sea-glass circle grows and shrinks with
// "Breathe in / Breathe out" and a small countdown. With reduced motion the circle stays still
// and only the words cross-fade. Then the same "Did the urge pass?" check-in as a walk.
function BreatheScreen({ onSave, onCancel }) {
  const [startedAt] = useState(() => Date.now())
  const [now, setNow] = useState(startedAt)
  const [endedAt, setEndedAt] = useState(null)
  const elapsed = (endedAt ?? now) - startedAt
  const left = Math.max(0, Math.ceil((BREATHE_SECONDS * 1000 - elapsed) / 1000))
  const phase = breathPhase(elapsed)
  // Mount small, then start the first breath (so the circle visibly grows)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)))
    return () => cancelAnimationFrame(id)
  }, [])
  useWakeLock(endedAt == null)

  useEffect(() => {
    if (endedAt != null) return undefined
    const tick = () => setNow(Date.now())
    const timer = setInterval(tick, 200)
    document.addEventListener('visibilitychange', tick)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick) }
  }, [endedAt])

  // The minute is up: move to the check-in. Reacting to the clock is what this effect is for.
  useEffect(() => {
    // eslint-disable-next-line react/set-state-in-effect
    if (endedAt == null && elapsed >= BREATHE_SECONDS * 1000) setEndedAt(startedAt + BREATHE_SECONDS * 1000)
  }, [elapsed, endedAt, startedAt])

  // A gentle tap at each phase change, where the phone supports it.
  useEffect(() => {
    if (endedAt == null) navigator.vibrate?.(8)
  }, [phase, endedAt])

  if (endedAt != null) {
    const secs = Math.round((endedAt - startedAt) / 1000)
    const m = Math.floor(secs / 60)
    const s = String(secs % 60).padStart(2, '0')
    return (
      <section className="breathe-done" data-testid="breathe-done">
        <WalkFinish
          heading="Nice. That one passed a little."
          sub={`You breathed for ${m}:${s}.`}
          onSave={({ result, note }) => onSave({ startedAt, endedAt, result, note })}
          onSkip={() => onSave({ startedAt, endedAt, result: null, note: '' })}
        />
      </section>
    )
  }

  const mm = Math.floor(left / 60)
  const ss = String(left % 60).padStart(2, '0')
  return (
    <section className="breathe" data-testid="breathe">
      <div className="breathe-main">
        <div className={`breathe-orb breathe-${ready ? phase : 'start'}`} data-testid="breathe-orb" aria-hidden="true">
          <div className="breathe-ring" />
          <div className="breathe-guide" />
          <div className="breathe-halo" />
          <div className="breathe-pearl" />
        </div>
        <div className="breathe-words" aria-live="polite">
          <p key={phase} className="breathe-word" data-testid="breathe-word">{phase === 'in' ? 'Breathe in' : 'Breathe out'}</p>
        </div>
        <p className="breathe-count" data-testid="breathe-count" aria-label={`${left} seconds left`}>{mm}:{ss}</p>
      </div>
      <button className="breathe-finish" onClick={() => (elapsed < 3000 ? onCancel() : setEndedAt(Date.now()))}>Finish</button>
    </section>
  )
}

export default BreatheScreen
