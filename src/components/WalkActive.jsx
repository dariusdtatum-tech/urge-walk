import { useState } from 'react'
import { encouragementLines } from '../lib/encouragement.js'
import { loadProfile } from '../lib/profile.js'
import {
  EXTEND_MINUTES, canExtend, elapsedMs, formatClock, formatElapsed, isOpen, isPaused, messageIndex, progress,
  remainingMs,
} from '../lib/walkTimer.js'
import ConfirmDialog from './ConfirmDialog.jsx'
import ProgressRing from './ProgressRing.jsx'

// The walk in progress, in focus mode (no header, no tab bar).
// - Timed walk: countdown in a ring that fills as time passes; "+5 min" adds time.
// - Open walk: counts up inside a slowly breathing ring; no "+5 min".
// "Finish walk" is the one main button; Pause is quiet text.
function WalkActive({ walk, now, onPause, onResume, onFinish, onExtend, onCancel = () => {}, longPressTip = false }) {
  const [confirming, setConfirming] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [tip, setTip] = useState(longPressTip)
  const paused = isPaused(walk)
  const open = isOpen(walk)
  // Encouragement follows the "more of" picks from setup; the why sits above it.
  const [{ lines, why }] = useState(() => { const p = loadProfile(); return { lines: encouragementLines(p?.improve), why: p?.why ?? '' } })
  const message = lines[messageIndex(walk, now, lines.length)]
  const walked = formatElapsed(elapsedMs(walk, now))

  const time = open ? walked : formatClock(remainingMs(walk, now))
  let label = open ? 'walked so far' : 'left in your walk'
  if (paused) label = 'Paused'

  return (
    <section className="walk-active" data-testid="walk-live">
      {tip && (
        <div className="lp-tip" role="status" data-testid="longpress-tip">
          <p><b>Walk started from a long press.</b> Holding the wave button starts a walk right away. Tap it instead to choose Walk, Breathe or Just log it.</p>
          <button type="button" className="lp-tip-ok" onClick={() => setTip(false)}>Got it</button>
        </div>
      )}
      <div className="walk-live-main">
        <ProgressRing value={progress(walk, now)} open={open} paused={paused}>
          <span className="countdown" data-testid="countdown" aria-live="off">{time}</span>
          <span className="countdown-label">{label}</span>
          <span className="countdown-mode" data-testid="walk-mode">{open ? 'Open' : `${walk.plannedMinutes} min`}</span>
        </ProgressRing>

        {why && <p className="why-quote walk-why" data-testid="walk-why">“{why}”</p>}
        <p className="walk-message" aria-live="polite">{message}</p>
      </div>

      <div className="walk-controls">
        <button className="btn btn-primary btn-big btn-finish" onClick={() => setConfirming(true)}>Finish walk</button>
        <button type="button" className="quiet-btn walk-cancel" data-testid="walk-cancel" onClick={() => setCancelling(true)}>
          Cancel walk · nothing saved
        </button>
        <div className="walk-quiet">
          {paused ? (
            <button className="quiet-btn" onClick={onResume}>Resume</button>
          ) : (
            <button className="quiet-btn" onClick={onPause}>Pause</button>
          )}
          {!open && (
            <button
              className="pill-btn"
              aria-label={`Add ${EXTEND_MINUTES} minutes`}
              disabled={!canExtend(walk)}
              onClick={onExtend}
            >
              +{EXTEND_MINUTES} min
            </button>
          )}
        </div>
      </div>

      {cancelling && (
        <ConfirmDialog
          title="Cancel this walk?"
          message="Nothing will be saved. You can start again any time."
          confirmLabel="Cancel walk"
          cancelLabel="Keep walking"
          onCancel={() => setCancelling(false)}
          onConfirm={() => { setCancelling(false); onCancel() }}
        />
      )}
      {confirming && (
        <ConfirmDialog
          title={open || remainingMs(walk, now) <= 0 ? 'Finish your walk?' : 'Finish your walk now?'}
          message={open
            ? `You walked for ${time}. Ready to check in?`
            : `You walked for ${walked}. That’s okay. Any time you spent walking counts.`}
          confirmLabel="Finish"
          cancelLabel="Keep walking"
          danger={false}
          onCancel={() => setConfirming(false)}
          onConfirm={() => { setConfirming(false); onFinish() }}
        />
      )}
    </section>
  )
}

export default WalkActive
