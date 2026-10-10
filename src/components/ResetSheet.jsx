import { useState } from 'react'
import { isValidISODate } from '../lib/cleanTime.js'
import { earnedList, milestoneShort } from '../lib/milestones.js'
import { useSwipeDown } from '../lib/useSwipeDown.js'

const Check = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5 10 17 19 7" /></svg>

// "A slip isn't the end of the story." Start a new count for one tracker. Lists what is kept.
function ResetSheet({ habit, milestones, lifetime, today, onConfirm, onClose }) {
  const swipe = useSwipeDown(onClose)
  const [date, setDate] = useState(today)
  const earned = earnedList(milestones, habit.id)
  const range = earned.length === 0 ? 'none yet' : earned.length === 1 ? milestoneShort(earned[0].milestone)
    : `${milestoneShort(earned[0].milestone)} → ${milestoneShort(earned.at(-1).milestone)}`
  const valid = isValidISODate(date) && date <= today && date >= habit.startDate
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet reset-sheet" role="dialog" aria-modal="true" aria-labelledby="reset-title"
        data-testid="reset-sheet" onClick={(e) => e.stopPropagation()} {...swipe}>
        <div className="sheet-handle" aria-hidden="true" />
        <h2 id="reset-title" className="reset-title">A slip isn’t the end of the story.</h2>
        <p className="reset-lead">Starting a new count for {habit.name} is honest, not failure. Everything you’ve built stays with you.</p>
        <ul className="reset-kept">
          <li><span className="reset-ck"><Check /></span>All walks, breaths and journal entries</li>
          <li><span className="reset-ck"><Check /></span>Milestones you earned ({range})</li>
          <li><span className="reset-ck"><Check /></span>Urges ridden out · {lifetime.toLocaleString()}</li>
        </ul>
        <label className="reset-date">
          <span>New count starts</span>
          <span className="reset-date-val">{date === today ? 'Today' : date}<span aria-hidden="true"> ▾</span></span>
          <input type="date" value={date} min={habit.startDate} max={today} aria-label="New count starts"
            onChange={(e) => setDate(e.target.value || today)} />
        </label>
        <button type="button" className="btn btn-primary reset-go" disabled={!valid} onClick={() => onConfirm(date)}>Start a new count</button>
        <button type="button" className="ob-link reset-not-now" onClick={onClose}>Not now</button>
      </div>
    </div>
  )
}

export default ResetSheet
