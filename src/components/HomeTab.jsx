import { useState } from 'react'
import { dismissNudge, loadBackupMeta, shouldNudge } from '../lib/backup.js'
import { RANGES, RANGE_IDS, bucketCounts, cleanDays, heroHabit, makePrimary, rangeBuckets, rangeStats, shortDate } from '../lib/homeStats.js'
import { loadJournal } from '../lib/journal.js'
import { isIOS } from '../lib/persist.js'
import { loadHabits, makeId, saveHabits } from '../lib/storage.js'
import { useNow, useToday } from '../lib/useToday.js'
import { loadActiveWalk, loadWalks } from '../lib/walkStorage.js'
import HabitSheet from './HabitSheet.jsx'
import HeroRing from './HeroRing.jsx'
import { FlameIcon } from './Icons.jsx'
import PageHeader from './PageHeader.jsx'
import TrackerSheet from './TrackerSheet.jsx'
import WeekChart from './WeekChart.jsx'

// Home: one ring for the main tracker, a D / W / M toggle for the chips and chart,
// three stat chips and the "urges walked" line.
function HomeTab({ onUrge, onOpenBackup }) {
  const today = useToday()
  const now = useNow()
  // Load saved data once, when the tab first appears.
  const [initial] = useState(() => ({ ...loadHabits(), walks: loadWalks().walks }))
  const [habits, setHabits] = useState(initial.habits)
  const walks = initial.walks
  const [notice, setNotice] = useState(
    initial.recovered ? 'Some saved data was damaged and couldn’t be read. A backup was kept on this phone.' : '',
  )
  // null = closed, { mode: 'manage' }, { mode: 'add', from }, or { mode: 'edit', habit, from }
  const [sheet, setSheet] = useState(null)
  // D / W / M: changes the chips and the chart only, never the ring.
  const [range, setRange] = useState('W')
  const walkInProgress = loadActiveWalk() != null
  // Gentle backup reminder (data only lives on this phone)
  const [showNudge, setShowNudge] = useState(() => shouldNudge(
    loadBackupMeta(),
    initial.habits.length > 0 || walks.length > 0 || loadJournal().entries.length > 0,
  ))

  function update(next) {
    setHabits(next)
    if (!saveHabits(next)) setNotice('Couldn’t save on this phone. Is private browsing on?')
  }

  // After adding/editing from the Edit sheet, go back to it.
  const back = () => setSheet(sheet?.from === 'manage' ? { mode: 'manage' } : null)

  function handleSave(values) {
    if (sheet.mode === 'add') {
      update([...habits, { id: makeId(), ...values }])
    } else {
      update(habits.map((h) => (h.id === sheet.habit.id ? { ...h, ...values } : h)))
    }
    back()
  }

  function handleDelete() {
    update(habits.filter((h) => h.id !== sheet.habit.id))
    back()
  }

  const hero = heroHabit(habits)
  const days = cleanDays(hero, today)
  const stats = rangeStats(walks, range, now)
  const buckets = rangeBuckets(range, now)
  const sub = RANGES[range].sub
  let since = ''
  if (hero) since = hero.startDate > today ? `starts ${shortDate(hero.startDate, today)}` : `since ${shortDate(hero.startDate, today)}`

  return (
    <div className="home">
      <PageHeader
        title="Home"
        tagline="One day at a time."
        action={<button className="header-link" onClick={() => setSheet({ mode: 'manage' })}>Edit</button>}
      />

      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
          <button className="icon-btn" onClick={() => setNotice('')} aria-label="Dismiss">✕</button>
        </div>
      )}

      {walkInProgress && (
        <button className="resume-walk" onClick={onUrge}>
          <span>Your walk is waiting</span>
          <span className="resume-walk-go">Back to your walk ›</span>
        </button>
      )}

      {(hero || walks.length > 0) && (
        <div className="range-toggle" role="group" aria-label="Chips and chart range">
          {RANGE_IDS.map((id) => (
            <button
              key={id}
              className={id === range ? 'range-btn active' : 'range-btn'}
              aria-pressed={id === range}
              aria-label={RANGES[id].name}
              onClick={() => setRange(id)}
            >
              {id}
            </button>
          ))}
        </div>
      )}

      {hero ? (
        <HeroRing name={hero.name} days={days} caption={since} />
      ) : (
        <section className="empty">
          <div className="empty-icon" aria-hidden="true">🌅</div>
          <h2>Every day counts</h2>
          <p>Add the date you started, and Urge Walk will count your clean days. It stays on this phone only.</p>
          <button className="btn btn-primary btn-big" onClick={() => setSheet({ mode: 'add' })}>
            Add your sober date
          </button>
          <button className="btn btn-ghost empty-restore" onClick={onOpenBackup}>Restore from a backup</button>
          {isIOS() && (
            <p className="empty-note">
              On iPhone, the Home Screen app and Safari keep separate data. Add your date in the one you’ll use.
            </p>
          )}
        </section>
      )}

      {(hero || walks.length > 0) && (
        <>
          <div className={hero ? 'chips' : 'chips chips-2'} data-testid="chips">
            {hero && (
              <div className="chip-stat" data-testid="chip-streak">
                <span className="stat-num"><FlameIcon />{days.toLocaleString()}</span>
                <span className="stat-label">Streak</span>
                <span className="stat-sub">clean</span>
              </div>
            )}
            <div className="chip-stat" data-testid="chip-walked">
              <span className="stat-num">{stats.walked}</span>
              <span className="stat-label">Walked</span>
              <span className="stat-sub">{sub}</span>
            </div>
            <div className="chip-stat" data-testid="chip-passed">
              <span className="stat-num">{stats.passed}</span>
              <span className="stat-label">Passed</span>
              <span className="stat-sub">{sub}</span>
            </div>
          </div>

          <WeekChart title={RANGES[range].title} buckets={buckets} counts={bucketCounts(walks, buckets)} />
        </>
      )}

      {showNudge && (
        <div className="nudge" data-testid="backup-nudge">
          <span className="nudge-text">Your data lives only on this phone. It’s been a while since your last backup.</span>
          <button className="btn btn-ghost nudge-action" onClick={onOpenBackup}>Back up</button>
          <button className="icon-btn" aria-label="Dismiss backup reminder" onClick={() => { dismissNudge(); setShowNudge(false) }}>✕</button>
        </div>
      )}

      {sheet?.mode === 'manage' && (
        <TrackerSheet
          habits={habits}
          today={today}
          onEdit={(habit) => setSheet({ mode: 'edit', habit, from: 'manage' })}
          onAdd={() => setSheet({ mode: 'add', from: 'manage' })}
          onMakePrimary={(id) => update(makePrimary(habits, id))}
          onOpenBackup={() => { setSheet(null); onOpenBackup() }}
          onClose={() => setSheet(null)}
        />
      )}
      {(sheet?.mode === 'add' || sheet?.mode === 'edit') && (
        <HabitSheet
          key={sheet.mode === 'edit' ? sheet.habit.id : 'new'}
          habit={sheet.mode === 'edit' ? sheet.habit : null}
          today={today}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={back}
        />
      )}
    </div>
  )
}

export default HomeTab
