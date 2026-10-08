import { useState } from 'react'
import { useToday } from '../lib/useToday.js'
import { deleteWalk, formatDuration, formatTimeOfDay, groupByDay, summarize, updateWalk } from '../lib/logStats.js'
import { loadWalks, saveWalks } from '../lib/walkStorage.js'
import ResultPill from './ResultPill.jsx'
import WalkDetailSheet from './WalkDetailSheet.jsx'

// Log tab: a summary of all walks, then the history grouped by day.
function LogTab({ onGoToWalk }) {
  const today = useToday()
  const [initial] = useState(() => loadWalks())
  const [walks, setWalks] = useState(initial.walks)
  const [notice, setNotice] = useState(
    initial.recovered ? 'Some saved walks were damaged and couldn’t be read. A backup was kept on this phone.' : '',
  )
  const [selectedId, setSelectedId] = useState(null)
  const selected = walks.find((w) => w.id === selectedId)

  // Save right away, then update the screen.
  function update(next) {
    if (!saveWalks(next)) setNotice('Couldn’t save on this phone. Is private browsing on?')
    setWalks(next)
    setSelectedId(null)
  }

  const noticeBox = notice && (
    <div className="notice" role="status">
      <span>{notice}</span>
      <button className="icon-btn" onClick={() => setNotice('')} aria-label="Dismiss">✕</button>
    </div>
  )

  if (walks.length === 0) {
    return (
      <div className="log">
        {noticeBox}
        <section className="empty">
          <div className="empty-icon" aria-hidden="true">🗒️</div>
          <h2>No walks yet</h2>
          <p>Next time an urge shows up, take a walk. Each one you finish will be saved here.</p>
          <button className="btn btn-primary btn-big" onClick={onGoToWalk}>Go to Walk</button>
        </section>
      </div>
    )
  }

  const s = summarize(walks)
  const groups = groupByDay(walks, today)

  return (
    <div className="log">
      {noticeBox}

      <section className="summary" aria-label="Summary">
        <p className="summary-big" data-testid="summary-total">
          <span className="summary-number">{s.total}</span>
          {s.total === 1 ? ' urge walked off' : ' urges walked off'}
        </p>
        <p className="summary-sub" data-testid="summary-passed">
          {s.yes} passed · {s.totalMinutes} {s.totalMinutes === 1 ? 'minute' : 'minutes'} walked
        </p>
        <div className="summary-counts" data-testid="summary-counts">
          <span className="count count-yes"><b>{s.yes}</b> Yes</span>
          <span className="count count-kinda"><b>{s.kinda}</b> Kinda</span>
          <span className="count count-no"><b>{s.no}</b> No</span>
          {s.skipped > 0 && <span className="count count-skipped"><b>{s.skipped}</b> No check-in</span>}
        </div>
        <p className="summary-cheer">Every walk is proof an urge doesn’t get the final say.</p>
      </section>

      {groups.map((g) => (
        <section key={g.key} className="log-day" aria-label={g.label}>
          <h3 className="log-day-title">{g.label}</h3>
          <ul className="log-list">
            {g.walks.map((w) => (
              <li key={w.id}>
                <button className="log-entry" data-testid="log-entry" onClick={() => setSelectedId(w.id)}>
                  <div className="log-entry-top">
                    <span className="log-time">{formatTimeOfDay(w.startedAt)}</span>
                    <span className="log-minutes">
                      {formatDuration(w.actualSeconds)} walk
                      {w.endedEarly && <span className="tag">Ended early</span>}
                    </span>
                    <ResultPill result={w.result} />
                  </div>
                  {w.note && <p className="log-note">{w.note}</p>}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {selected && (
        <WalkDetailSheet
          key={selected.id}
          walk={selected}
          onSave={(changes) => update(updateWalk(walks, selected.id, changes))}
          onDelete={() => update(deleteWalk(walks, selected.id))}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}

export default LogTab
