import { useState } from 'react'
import { WALK_MESSAGES } from '../lib/walkMessages.js'
import {
  elapsedMs, formatClock, formatElapsed, isOpen, isPaused, messageIndex, progress, remainingMs,
} from '../lib/walkTimer.js'
import ConfirmDialog from './ConfirmDialog.jsx'
import ProgressRing from './ProgressRing.jsx'

// The walk in progress.
// - Timed walk: countdown, filling ring, Pause/Resume and End early.
// - Open walk: counts up from 0:00, calm full ring, Pause/Resume and Finish walk.
function WalkActive({ walk, now, onPause, onResume, onEndEarly, onFinish }) {
  const [confirming, setConfirming] = useState(false)
  const paused = isPaused(walk)
  const open = isOpen(walk)
  const message = WALK_MESSAGES[messageIndex(walk, now, WALK_MESSAGES.length)]

  const time = open ? formatElapsed(elapsedMs(walk, now)) : formatClock(remainingMs(walk, now))
  let label = open ? 'walked so far' : 'left in your walk'
  if (paused) label = 'Paused'

  return (
    <section className="walk-active">
      <ProgressRing value={open ? 1 : progress(walk, now)} open={open} paused={paused}>
        <span className="countdown" data-testid="countdown" aria-live="off">{time}</span>
        <span className="countdown-label">{label}</span>
        {open && <span className="countdown-mode">Open walk</span>}
      </ProgressRing>

      <p className="walk-message" aria-live="polite">{message}</p>

      <div className="walk-controls">
        {open ? (
          <>
            <button className="btn btn-primary btn-big" onClick={() => setConfirming(true)}>Finish walk</button>
            {paused ? (
              <button className="btn btn-secondary btn-big" onClick={onResume}>Resume</button>
            ) : (
              <button className="btn btn-secondary btn-big" onClick={onPause}>Pause</button>
            )}
          </>
        ) : (
          <>
            {paused ? (
              <button className="btn btn-primary btn-big" onClick={onResume}>Resume</button>
            ) : (
              <button className="btn btn-secondary btn-big" onClick={onPause}>Pause</button>
            )}
            <button className="btn btn-ghost" onClick={() => setConfirming(true)}>End early</button>
          </>
        )}
      </div>

      {confirming && (open ? (
        <ConfirmDialog
          title="Finish your walk?"
          message={`You walked for ${time}. Ready to check in?`}
          confirmLabel="Finish"
          cancelLabel="Keep walking"
          danger={false}
          onCancel={() => setConfirming(false)}
          onConfirm={() => { setConfirming(false); onFinish() }}
        />
      ) : (
        <ConfirmDialog
          title="End the walk now?"
          message="That’s okay. Any time you spent walking counts."
          confirmLabel="End walk"
          cancelLabel="Keep walking"
          danger={false}
          onCancel={() => setConfirming(false)}
          onConfirm={() => { setConfirming(false); onEndEarly() }}
        />
      ))}
    </section>
  )
}

export default WalkActive
