import { useState } from 'react'
import { MAX_NOTE_LENGTH } from '../lib/walkStorage.js'
import { elapsedMs, formatElapsed, isOpen } from '../lib/walkTimer.js'

const CHOICES = [
  { id: 'yes', label: 'Yes' },
  { id: 'kinda', label: 'Kinda' },
  { id: 'no', label: 'No' },
]

// After the walk: "Did the urge pass?", an optional note, then Save or Skip.
function WalkFinish({ walk, onSave, onSkip }) {
  const [result, setResult] = useState(null)
  const [note, setNote] = useState('')
  const walked = formatElapsed(elapsedMs(walk, walk.endedAt))
  let heading = 'You did it.'
  if (isOpen(walk)) heading = 'Nice walk.'
  else if (walk.endedEarly) heading = 'You took a break from the urge.'

  return (
    <section className="walk-finish">
      <div className="finish-icon" aria-hidden="true">🌿</div>
      <h2>{heading}</h2>
      <p className="finish-sub">You walked for {walked}.</p>

      <fieldset className="finish-question">
        <legend>Did the urge pass?</legend>
        <div className="segmented">
          {CHOICES.map((c) => (
            <button
              key={c.id}
              type="button"
              className={result === c.id ? 'segment active' : 'segment'}
              aria-pressed={result === c.id}
              onClick={() => setResult(result === c.id ? null : c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </fieldset>

      <label className="field">
        <span>Anything you want to remember? (optional)</span>
        <textarea
          rows={3}
          maxLength={MAX_NOTE_LENGTH}
          value={note}
          placeholder="What helped, what you noticed…"
          onChange={(e) => setNote(e.target.value)}
        />
      </label>

      <div className="sheet-actions">
        <button type="button" className="btn btn-secondary" onClick={onSkip}>Skip</button>
        <button type="button" className="btn btn-primary" onClick={() => onSave({ result, note })}>Save</button>
      </div>
    </section>
  )
}

export default WalkFinish
