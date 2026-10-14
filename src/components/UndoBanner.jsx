import { shortDate } from '../lib/homeStats.js'
import { todayISO } from '../lib/cleanTime.js'

// Shown on Home for the full 24 hours after a reset: plain, free, no pressure.
function UndoBanner({ habit, until, now, today, showName, onUndo, onDismiss }) {
  const prev = habit.resets.at(-1).prevStartDate
  const time = new Date(until).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const day = todayISO(new Date(until)) === todayISO(new Date(now)) ? 'today' : 'tomorrow'
  return (
    <section className="undo-banner" data-testid="undo-banner" role="status" aria-label="Undo reset">
      <p className="undo-banner-title">New count started{showName ? ` · ${habit.name}` : ''}</p>
      <p className="undo-banner-text">
        Changed your mind? Undo puts back your start date ({shortDate(prev, today)}). Free, until {time} {day}.
      </p>
      <div className="undo-banner-actions">
        <button type="button" className="undo-banner-btn" data-testid="undo-banner-undo" onClick={onUndo}>Undo reset</button>
        <button type="button" className="undo-banner-dismiss" onClick={onDismiss}>Dismiss</button>
      </div>
    </section>
  )
}

export default UndoBanner
