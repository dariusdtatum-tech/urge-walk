import { breakdown, formatBreakdown } from '../lib/cleanTime.js'
import { cleanDays, shortDate } from '../lib/homeStats.js'

// "Edit" on Home: every tracker, which one is on Home, add another, and Backup.
// Home shows one ring; additional trackers live here so Home stays one calm view.
function TrackerSheet({ habits, today, onEdit, onAdd, onMakePrimary, onOpenBackup, onClose }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="trackers-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-title-row">
          <h2 id="trackers-title">Your trackers</h2>
          <button className="icon-btn" onClick={onClose}>Done</button>
        </div>

        {habits.length === 0 ? (
          <p className="sheet-hint">No trackers yet. Add the date you started and Home will count your clean days.</p>
        ) : (
          <ul className="tracker-list">
            {habits.map((h, i) => {
              const days = cleanDays(h, today)
              const b = breakdown(h.startDate, today)
              return (
                <li key={h.id} className="tracker-row" data-testid="tracker-row">
                  <div className="tracker-info">
                    <span className="tracker-name">{h.name}</span>
                    <span className="tracker-meta">
                      <b data-testid="tracker-days">{days.toLocaleString()}</b> {days === 1 ? 'day' : 'days'}
                      {' · since '}{shortDate(h.startDate, today)}
                    </span>
                    {b && b.totalDays > 0 && <span className="tracker-breakdown">{formatBreakdown(b)}</span>}
                  </div>
                  <div className="tracker-actions">
                    {i === 0 ? (
                      <span className="tracker-badge">On Home</span>
                    ) : (
                      <button className="btn btn-ghost tracker-home" aria-label={`Show ${h.name} on Home`}
                        onClick={() => onMakePrimary(h.id)}>
                        Show on Home
                      </button>
                    )}
                    <button className="icon-btn" aria-label={`Edit ${h.name}`} onClick={() => onEdit(h)}>Edit</button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <button className="btn btn-secondary btn-big" onClick={onAdd}>
          {habits.length === 0 ? 'Add your sober date' : '+ Add another'}
        </button>

        <button className="settings-row" onClick={onOpenBackup}>
          <span>
            <span className="settings-row-title">Backup &amp; restore</span>
            <span className="settings-row-sub">Save everything to a file, or bring it back</span>
          </span>
          <span aria-hidden="true">›</span>
        </button>
      </div>
    </div>
  )
}

export default TrackerSheet
