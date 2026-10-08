import { useState } from 'react'
import { WALK_MESSAGES } from '../lib/walkMessages.js'
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
function WalkActive({ walk, now, onPause, onResume, onFinish, onExtend }) {
  const [confirming, setConfirming] = useState(false)
  const paused = isPaused(walk)
  const open = isOpen(walk)
  const message = WALK_MESSAGES[messageIndex(walk, now, WALK_MESSAGES.length)]
  const walked = formatElapsed(elapsedMs(walk, now))

  const time = open ? walked : formatClock(remainingMs(walk, now))
  let label = open ? 'walked so far' : 'left in your walk'
  if (paused) label = 'Paused'

  return (
    <section className="walk-active" data-testid="walk-live">
      <div className="walk-live-main">
        <ProgressRing value={progress(walk, now)} open={open} paused={paused}>
          <span className="countdown" data-testid="countdown" aria-live="off">{time}</span>
          <span className="countdown-label">{label}</span>
          <span className="countdown-mode" data-testid="walk-mode">{open ? 'Open' : `${walk.plannedMinutes} min`}</span>
        </ProgressRing>

        <p className="walk-message" aria-live="polite">{message}</p>
      </div>

      <div className="walk-controls">
        <button className="btn btn-primary btn-big btn-finish" onClick={() => setConfirming(true)}>Finish walk</button>
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
