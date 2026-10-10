import { useState } from 'react'
import { encouragementLines } from '../lib/encouragement.js'
import { loadProfile, trustedContact } from '../lib/profile.js'
import { MAX_NOTE_LENGTH } from '../lib/walkStorage.js'
import { PathIcon, WaveIcon } from './Icons.jsx'
import { useSwipeDown } from '../lib/useSwipeDown.js'

// "Ride it out": two big choices (Walk at the remembered length, or Breathe for a minute)
// and a quiet "Just log it" for an urge already ridden out. Swipe down or tap outside to close.
function RideSheet({ walkLabel, onWalk, onBreathe, onLog, onClose }) {
  const swipe = useSwipeDown(onClose)
  const [logging, setLogging] = useState(false)
  const [note, setNote] = useState('')
  const [{ why, line, contact }] = useState(() => {
    const p = loadProfile()
    const lines = encouragementLines(p?.improve)
    // A line from the "more of" picks only (none without picks, so the default sheet stays short).
    const line = p?.improve?.length ? lines[Math.floor(Math.random() * lines.length)] : ''
    return { why: p?.why ?? '', line, contact: trustedContact(p) }
  })

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="sheet ride-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ride-title"
        data-testid="ride-sheet"
        onClick={(e) => e.stopPropagation()}
        {...swipe}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <h2 id="ride-title" className="ride-title">Ride it out</h2>
        {why ? <p className="why-quote ride-why" data-testid="ride-why">“{why}”</p> : line && <p className="ride-line" data-testid="ride-line">{line}</p>}
        {!logging ? (
          <>
            <div className="ride-tiles">
              <button className="ride-tile ride-walk" onClick={onWalk} aria-label={`Walk, ${walkLabel}. Starts now`}>
                <PathIcon />
                <span className="ride-tile-name">Walk</span>
                <span className="ride-tile-sub">{walkLabel}</span>
              </button>
              <button className="ride-tile ride-breathe" onClick={onBreathe} aria-label="Breathe for 1 minute">
                <WaveIcon size={32} />
                <span className="ride-tile-name">Breathe</span>
                <span className="ride-tile-sub">1 min</span>
              </button>
            </div>
            {contact && (
              <a className="ride-text" href={contact.href} data-testid="ride-text">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5.5h16v10H9l-5 4z" /></svg>
                Text {contact.name}
              </a>
            )}
            <button className="ride-log-link" onClick={() => setLogging(true)}>Just log it</button>
          </>
        ) : (
          <form className="ride-log" onSubmit={(e) => { e.preventDefault(); onLog(note) }}>
            <p className="ride-log-lead">An urge you rode out, logged for right now.</p>
            <label className="field">
              <span>Note (optional)</span>
              <textarea rows={2} maxLength={MAX_NOTE_LENGTH} value={note} autoFocus
                placeholder="What helped?" onChange={(e) => setNote(e.target.value)} />
            </label>
            <div className="sheet-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setLogging(false)}>Back</button>
              <button type="submit" className="btn btn-primary">Save</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default RideSheet
