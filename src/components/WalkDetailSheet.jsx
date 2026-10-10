import { useState } from 'react'
import { dayLabel, finishedLabel, kindOf, formatDuration, formatTimeOfDay, localDayKey, plannedLabel } from '../lib/logStats.js'
import { todayISO } from '../lib/cleanTime.js'
import { MAX_NOTE_LENGTH } from '../lib/walkStorage.js'
import ConfirmDialog from './ConfirmDialog.jsx'

const CHOICES = [
  { id: 'yes', label: 'Yes' },
  { id: 'kinda', label: 'Kinda' },
  { id: 'no', label: 'No' },
]

// Details of one walk, with the result and note editable and a delete option.
function WalkDetailSheet({ walk, onSave, onDelete, onClose }) {
  const [result, setResult] = useState(walk.result)
  const [note, setNote] = useState(walk.note)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const day = dayLabel(localDayKey(walk.startedAt), todayISO())

  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="walk-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <h2 id="walk-detail-title">{day} · {formatTimeOfDay(walk.startedAt)}</h2>

        <dl className="detail-grid">
          <div><dt>{{ walk: 'Walked', breathe: 'Breathed', logged: 'Logged' }[kindOf(walk)]}</dt><dd>{kindOf(walk) === 'logged' ? 'Rode it out' : formatDuration(walk.actualSeconds)}</dd></div>
          <div><dt>Planned</dt><dd>{plannedLabel(walk)}</dd></div>
          <div><dt>Finished</dt><dd>{finishedLabel(walk)}</dd></div>
        </dl>

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
          <span>Note</span>
          <textarea
            rows={3}
            maxLength={MAX_NOTE_LENGTH}
            value={note}
            placeholder="What helped, what you noticed…"
            onChange={(e) => setNote(e.target.value)}
          />
        </label>

        <div className="sheet-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={() => onSave({ result, note })}>Save</button>
        </div>

        <div className="sheet-danger sheet-danger-end">
          <button type="button" className="btn btn-ghost btn-ghost-danger" onClick={() => setConfirmDelete(true)}>
            {kindOf(walk) === 'walk' ? 'Delete this walk' : 'Delete this entry'}
          </button>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title={kindOf(walk) === 'walk' ? 'Delete this walk?' : 'Delete this entry?'}
          message="It will be removed from your log on this phone. This can’t be undone."
          confirmLabel="Delete"
          onCancel={() => setConfirmDelete(false)}
          onConfirm={onDelete}
        />
      )}
    </div>
  )
}

export default WalkDetailSheet
