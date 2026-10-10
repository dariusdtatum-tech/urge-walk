import { useState } from 'react'
import { isValidISODate } from '../lib/cleanTime.js'
import { MAX_NAME_LENGTH } from '../lib/storage.js'
import ConfirmDialog from './ConfirmDialog.jsx'

// Bottom sheet for adding a new habit or editing an existing one.
// In edit mode it also offers "Start a new count" (the kind reset sheet) and "Delete" (confirmed).
function HabitSheet({ habit, today, onSave, onDelete, onReset, onClose }) {
  const isEdit = Boolean(habit)
  const [name, setName] = useState(habit ? habit.name : '')
  const [startDate, setStartDate] = useState(habit ? habit.startDate : today)
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(null) // null | 'delete'

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return setError('Give it a name, like "Drinking" or "Smoking".')
    if (!isValidISODate(startDate)) return setError('Pick your start date.')
    if (startDate > today) return setError('The start date can’t be in the future.')
    onSave({ name: trimmed, startDate })
  }

  return (
    <div className="overlay" onClick={onClose}>
      <form
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="sheet-handle" aria-hidden="true" />
        <h2 id="sheet-title">{isEdit ? 'Edit habit' : 'Add your sober date'}</h2>

        <label className="field">
          <span>What are you staying away from?</span>
          <input
            type="text"
            value={name}
            maxLength={MAX_NAME_LENGTH}
            placeholder="e.g. Drinking"
            autoComplete="off"
            onChange={(e) => { setName(e.target.value); setError('') }}
          />
        </label>

        <label className="field">
          <span>Sober since</span>
          <input
            type="date"
            value={startDate}
            min="1900-01-01"
            max={today}
            onChange={(e) => { setStartDate(e.target.value); setError('') }}
          />
        </label>

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="sheet-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn btn-primary">{isEdit ? 'Save' : 'Add'}</button>
        </div>

        {isEdit && (
          <div className="sheet-danger">
            <button type="button" className="btn btn-ghost" onClick={onReset}>
              Start a new count
            </button>
            <button type="button" className="btn btn-ghost btn-ghost-danger" onClick={() => setConfirm('delete')}>
              Delete
            </button>
          </div>
        )}
      </form>

      {confirm === 'delete' && (
        <ConfirmDialog
          title="Delete this habit?"
          message={`"${habit.name}" and its date will be removed from this phone. This can't be undone.`}
          confirmLabel="Delete"
          onCancel={() => setConfirm(null)}
          onConfirm={onDelete}
        />
      )}
    </div>
  )
}

export default HabitSheet
