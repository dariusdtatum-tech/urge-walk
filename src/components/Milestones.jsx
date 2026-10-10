import { useEffect, useRef } from 'react'
import { shortDate } from '../lib/homeStats.js'
import { useSwipeDown } from '../lib/useSwipeDown.js'
import { earnedList, milestoneName, milestoneRows, milestoneShort, nextUnearned } from '../lib/milestones.js'

// Badge row under "Your walks": earned (filled mint) + the next one (faint dashed outline).
// Laid out right-to-left and wrapping into a hidden second line, so on narrow screens the
// oldest earned badges are the ones that drop out first.
export function MilestoneRow({ data, habitId, onOpen }) {
  const earned = earnedList(data, habitId)
  const next = nextUnearned(data, habitId)
  const shown = [...earned.slice(-6).map((e) => ({ m: e.milestone, earned: true })), { m: next, earned: false }]
  return (
    <button className="milestone-row" onClick={onOpen} aria-label={`Milestones: ${earned.length} earned, next ${milestoneName(next)}`}>
      <span className="milestone-title">Milestones</span>
      <span className="badges" data-testid="badges">
        {[...shown].reverse().map((b) => (
          <span key={b.m} className={b.earned ? 'badge earned' : 'badge next'} data-testid={b.earned ? 'badge-earned' : 'badge-next'}>
            {milestoneShort(b.m)}
          </span>
        ))}
      </span>
    </button>
  )
}

// Swipe down (or tap outside) closes a bottom sheet.
export function MilestoneSheet({ milestone, habitName, showName, onDone }) {
  const swipe = useSwipeDown(onDone)
  const ref = useRef(null)
  // Move focus into the sheet for screen readers / keyboards, without a focus ring on Done.
  useEffect(() => { ref.current?.focus() }, [])
  return (
    <div className="overlay overlay-light milestone-overlay" onClick={onDone}>
      <div
        ref={ref}
        tabIndex={-1}
        onKeyDown={(e) => { if (e.key === 'Escape') onDone() }}
        className="sheet milestone-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="milestone-title"
        data-testid="milestone-sheet"
        onClick={(e) => e.stopPropagation()}
        {...swipe}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <div className="badge-big-halo" aria-hidden="true"><span className="badge-big">{milestoneShort(milestone)}</span></div>
        {showName && <p className="milestone-habit">{habitName}</p>}
        <h2 id="milestone-title" className="milestone-name">{milestoneName(milestone)}</h2>
        <p className="milestone-days">{milestone.toLocaleString()} days clean</p>
        <p className="milestone-yours">That’s yours.</p>
        <button className="btn btn-primary btn-big btn-finish" onClick={onDone}>Done</button>
      </div>
    </div>
  )
}

// Every milestone with the date it was earned (or how far away it is).
export function MilestonesList({ data, habit, today, onClose }) {
  const swipe = useSwipeDown(onClose)
  const rows = milestoneRows(data, habit, today)
  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="milestones-list-title"
        onClick={(e) => e.stopPropagation()}
        {...swipe}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-title-row">
          <h2 id="milestones-list-title">Milestones</h2>
          <button className="icon-btn" onClick={onClose}>Done</button>
        </div>
        {habit && <p className="sheet-hint">{habit.name}. Earned milestones stay yours, even after a reset.</p>}
        <ul className="milestone-list">
          {rows.map((r) => (
            <li key={r.milestone} className="milestone-item" data-testid="milestone-item">
              <span className={r.date ? 'badge earned' : 'badge next'} aria-hidden="true">{milestoneShort(r.milestone)}</span>
              <span className="milestone-item-name">{r.name}</span>
              <span className={r.date ? 'milestone-item-when earned' : 'milestone-item-when'}>
                {r.date ? `Earned ${shortDate(r.date, today)}` : r.inDays ? `In ${r.inDays} ${r.inDays === 1 ? 'day' : 'days'}` : 'Not yet'}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
