import { useState } from 'react'
import { loadProfile, trustedContact } from '../lib/profile.js'
import { MAX_NOTE_LENGTH } from '../lib/walkStorage.js'
import { PathIcon, WaveIcon } from './Icons.jsx'
import { useSwipeDown } from '../lib/useSwipeDown.js'
import ConfirmDialog from './ConfirmDialog.jsx'

// "Ride it out": two big choices (Walk at the remembered length, or Breathe for a minute)
// and an equal "Just log it" for an urge already ridden out. Swipe down or tap outside to close;
// a typed note is never thrown away without asking.
// Same words as the Log tab tallies. Defaults to Passed; no keyboard until the note is tapped.
const LOG_RESULTS = [{ id: 'yes', label: 'Passed' }, { id: 'kinda', label: 'Kinda' }, { id: 'no', label: 'Didn’t' }]

function RideSheet({ walkLabel, onWalk, onBreathe, onLog, onClose }) {
  const [logging, setLogging] = useState(false)
  const [note, setNote] = useState('')
  const [result, setResult] = useState('yes')
  const [askDiscard, setAskDiscard] = useState(false)
  const close = () => { if (logging && note.trim()) setAskDiscard(true); else onClose() }
  const swipe = useSwipeDown(close)
  const [{ why, contact }] = useState(() => {
    const p = loadProfile()
    return { why: p?.why ?? '', contact: trustedContact(p) }
  })

  return (
    <div className="overlay" onClick={close}>
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
        {why && <p className="why-quote ride-why" data-testid="ride-why">“{why}”</p>}
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
            <button type="button" className="ride-log-btn" data-testid="ride-log" onClick={() => setLogging(true)}>
              <span className="ride-log-name">Just log it</span>
              <span className="ride-log-sub">I already rode it out</span>
            </button>
            {contact && (
              <a className="ride-text" href={contact.href} data-testid="ride-text">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5.5h16v10H9l-5 4z" /></svg>
                Text {contact.name}
              </a>
            )}
            <p className="ride-tip">Tip: press and hold the wave button to start a walk right away.</p>
          </>
        ) : (
          <form className="ride-log" onSubmit={(e) => { e.preventDefault(); onLog(note, result) }}>
            <p className="ride-log-lead">An urge from just now, logged as it went.</p>
            <fieldset className="finish-question ride-log-result">
              <legend>Did the urge pass?</legend>
              <div className="segmented" data-testid="ride-log-result">
                {LOG_RESULTS.map((c) => (
                  <button key={c.id} type="button" className={result === c.id ? 'segment active' : 'segment'}
                    aria-pressed={result === c.id} onClick={() => setResult(c.id)}>{c.label}</button>
                ))}
              </div>
            </fieldset>
            <label className="field">
              <span>Note (optional)</span>
              <textarea rows={2} maxLength={MAX_NOTE_LENGTH} value={note}
                placeholder="What helped?" onChange={(e) => setNote(e.target.value)} />
            </label>
            <div className="sheet-actions">
              <button type="button" className="btn btn-secondary" onClick={() => (note.trim() ? setAskDiscard(true) : setLogging(false))}>Back</button>
              <button type="submit" className="btn btn-primary">Save</button>
            </div>
          </form>
        )}
      </div>
      {askDiscard && (
        <div onClick={(e) => e.stopPropagation()}><ConfirmDialog
          title="Discard this note?"
          message="You typed a note that isn’t saved yet."
          confirmLabel="Discard note"
          cancelLabel="Keep editing"
          onCancel={() => setAskDiscard(false)}
          onConfirm={() => { setAskDiscard(false); onClose() }}
        /></div>
      )}
    </div>
  )
}

export default RideSheet
