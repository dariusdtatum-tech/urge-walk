import { useState } from 'react'
import { WALK_MESSAGES } from '../lib/walkMessages.js'
import { formatClock, isPaused, messageIndex, progress, remainingMs } from '../lib/walkTimer.js'
import ConfirmDialog from './ConfirmDialog.jsx'
import ProgressRing from './ProgressRing.jsx'

// The walk in progress: countdown, ring, a kind message, Pause/Resume and End early.
function WalkActive({ walk, now, onPause, onResume, onEndEarly }) {
  const [confirmEnd, setConfirmEnd] = useState(false)
  const paused = isPaused(walk)
  const message = WALK_MESSAGES[messageIndex(walk, now, WALK_MESSAGES.length)]

  return (
    <section className="walk-active">
      <ProgressRing value={progress(walk, now)}>
        <span className="countdown" data-testid="countdown" aria-live="off">
          {formatClock(remainingMs(walk, now))}
        </span>
        <span className="countdown-label">{paused ? 'Paused' : 'left in your walk'}</span>
      </ProgressRing>

      <p className="walk-message" aria-live="polite">{message}</p>

      <div className="walk-controls">
        {paused ? (
          <button className="btn btn-primary btn-big" onClick={onResume}>Resume</button>
        ) : (
          <button className="btn btn-secondary btn-big" onClick={onPause}>Pause</button>
        )}
        <button className="btn btn-ghost" onClick={() => setConfirmEnd(true)}>End early</button>
      </div>

      {confirmEnd && (
        <ConfirmDialog
          title="End the walk now?"
          message="That’s okay. Any time you spent walking counts."
          confirmLabel="End walk"
          cancelLabel="Keep walking"
          danger={false}
          onCancel={() => setConfirmEnd(false)}
          onConfirm={() => { setConfirmEnd(false); onEndEarly() }}
        />
      )}
    </section>
  )
}

export default WalkActive
