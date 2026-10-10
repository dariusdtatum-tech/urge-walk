import { useState } from 'react'
import { useToday } from '../lib/useToday.js'
import {
  OUTCOME_LABELS, deleteWalk, kindOf, formatTimeOfDay, groupByDay, summarize, updateWalk, walkSummaryLabel, weekDays,
} from '../lib/logStats.js'
import { loadWalks, saveWalks } from '../lib/walkStorage.js'
import ResultPill, { OutcomeMark } from './ResultPill.jsx'
import WalkDetailSheet from './WalkDetailSheet.jsx'

const DAY_COLORS = { yes: 'var(--res-yes)', kinda: 'var(--res-kinda)', no: 'var(--res-no)' }

// A day with more than one outcome is split into equal slices (e.g. mint / amber).
function splitFill(outcomes) {
  const step = 100 / outcomes.length
  const stops = outcomes.map((o, i) => `${DAY_COLORS[o]} ${i * step}% ${(i + 1) * step}%`)
  return `conic-gradient(${stops.join(', ')})`
}

function dayDescription(d) {
  if (d.state === 'none') return 'no urge logged'
  if (d.state === 'skipped') return `${d.count} ${d.count === 1 ? 'walk' : 'walks'}, no check-in`
  return d.outcomes.map((o) => OUTCOME_LABELS[o].toLowerCase()).join(' and ')
}

// Log tab: a summary of all walks, this week's day marks, then the history grouped by day.
function LogTab({ onGoToWalk, initialSelectedId = null }) {
  const today = useToday()
  const [initial] = useState(() => loadWalks())
  const [walks, setWalks] = useState(initial.walks)
  const [notice, setNotice] = useState(
    initial.recovered ? 'Some saved walks were damaged and couldn’t be read. A backup was kept on this phone.' : '',
  )
  const [selectedId, setSelectedId] = useState(initialSelectedId)
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
          <h2>No urges logged yet</h2>
          <p>Next time an urge shows up, ride it out: take a walk, breathe for a minute, or just log it. Each one is saved here.</p>
          <button className="btn btn-primary btn-big" onClick={onGoToWalk}>Ride it out</button>
        </section>
      </div>
    )
  }

  const s = summarize(walks)
  const groups = groupByDay(walks, today)
  const week = weekDays(walks, today)

  return (
    <div className="log">
      {noticeBox}

      <section className="summary" aria-label="Summary">
        <p className="summary-big" data-testid="summary-total">
          <span className="summary-number">{s.total}</span>
          {s.onlyWalks
            ? (s.total === 1 ? ' urge walked off' : ' urges walked off')
            : (s.total === 1 ? ' urge ridden out' : ' urges ridden out')}
        </p>
        <p className="summary-sub" data-testid="summary-passed">
          {s.yes} passed · {s.totalMinutes} {s.totalMinutes === 1 ? 'minute' : 'minutes'} walked
        </p>
        {!s.onlyWalks && (
          <p className="summary-sub" data-testid="summary-kinds">
            {[
              `${s.kinds.walk} ${s.kinds.walk === 1 ? 'walk' : 'walks'}`,
              s.kinds.breathe ? `${s.kinds.breathe} breathing` : null,
              s.kinds.logged ? `${s.kinds.logged} logged` : null,
            ].filter(Boolean).join(' · ')}
          </p>
        )}
        {/* One 4-up row, equal columns, never wraps */}
        <div className="outcome-row" data-testid="summary-counts">
          {[
            ['yes', s.yes, 'Passed'],
            ['kinda', s.kinda, 'Kinda'],
            ['no', s.no, 'Didn’t'],
            ['skipped', s.skipped, 'No check-in'],
          ].map(([key, n, label]) => (
            <div key={key} className={`outcome-cell outcome-${key}`} data-testid="outcome-cell"
              aria-label={`${n} ${OUTCOME_LABELS[key]}`}>
              <b>{n}</b>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <p className="summary-cheer">Every walk is proof an urge doesn’t get the final say.</p>
      </section>

      <section className="week-card" aria-label="This week">
        <h2 className="week-title">This week</h2>
        <ol className="week-days">
          {week.map((d) => (
            <li key={d.key} className={d.isToday ? 'week-day today' : 'week-day'}>
              <span
                className={`day-ring day-${d.outcomes.length > 1 ? 'mixed' : d.state}`}
                data-testid="day-ring"
                data-state={d.state}
                style={d.outcomes.length > 1 ? { background: splitFill(d.outcomes) } : undefined}
                role="img"
                aria-label={`${d.label}: ${dayDescription(d)}`}
              />
              <span className="week-label">{d.label}</span>
            </li>
          ))}
        </ol>
      </section>

      {groups.map((g) => (
        <section key={g.key} className="log-day" aria-label={g.label}>
          <h3 className="log-day-title">{g.label}</h3>
          <ul className="log-list">
            {g.walks.map((w) => (
              <li key={w.id}>
                <button className="log-entry log-walk" data-testid="log-entry" data-kind={kindOf(w)} onClick={() => setSelectedId(w.id)}>
                  <OutcomeMark result={w.result} />
                  <div className="log-entry-main">
                    <div className="log-entry-top">
                      <span className="log-time">{formatTimeOfDay(w.startedAt)}</span>
                      <span className="log-minutes">{walkSummaryLabel(w)}</span>
                      <ResultPill result={w.result} />
                    </div>
                    {w.endedEarly && <span className="tag">Ended early</span>}
                    {w.note && <p className="log-note">{w.note}</p>}
                  </div>
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
