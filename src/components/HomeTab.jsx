import { useEffect, useState } from 'react'
import { dismissNudge, loadBackupMeta, shouldNudge } from '../lib/backup.js'
import { todayISO } from '../lib/cleanTime.js'
import { cleanDays, heroHabit, loadRange, makePrimary, saveRange, shortDate } from '../lib/homeStats.js'
import {
  backfillTracker, loadMilestones, removeTracker, ringLabel, ringSegment, saveMilestones, syncMilestones,
} from '../lib/milestones.js'
import { loadJournal } from '../lib/journal.js'
import { isIOS } from '../lib/persist.js'
import { loadHabits, makeId, saveHabits } from '../lib/storage.js'
import { useNow, useToday } from '../lib/useToday.js'
import { loadActiveWalk, loadWalks } from '../lib/walkStorage.js'
import HabitSheet from './HabitSheet.jsx'
import HeroRing from './HeroRing.jsx'
import { MilestoneRow, MilestoneSheet, MilestonesList } from './Milestones.jsx'
import PageHeader from './PageHeader.jsx'
import TrackerSheet from './TrackerSheet.jsx'
import WalksCard from './WalksCard.jsx'

// Home: one ring for the main tracker (progress toward its next milestone), the "Your walks" card
// (Week / Month / All time changes only the card) and the Milestones badge row.
// Reaching a milestone shows one calm sheet, once per milestone per tracker.
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
  // null = closed, { mode: 'manage' }, { mode: 'add', from }, { mode: 'edit', habit, from }, or { mode: 'milestones' }
  const [sheet, setSheet] = useState(null)
  // Week / Month / All time: changes the walks card only, never the ring. Remembered.
  const [range, setRange] = useState(() => loadRange())
  const [milestones, setMilestones] = useState(() => loadMilestones())
  // Milestone sheets waiting to be shown: [{ habitId, milestone }]
  const [celebrations, setCelebrations] = useState([])
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

  function storeMilestones(next) {
    saveMilestones(next)
    setMilestones(next)
  }

  // Bring milestones up to date on open and whenever the date rolls over (midnight) or trackers change.
  // The phone's storage is the source of truth, so this never double-counts.
  useEffect(() => {
    const result = syncMilestones(loadMilestones(), habits, today)
    if (!result.changed) return
    saveMilestones(result.data)
    // Reacting to the calendar (an outside system) is what this effect is for.
    // eslint-disable-next-line react/set-state-in-effect
    setMilestones(result.data)
    if (result.celebrate.length > 0) setCelebrations((q) => [...q, ...result.celebrate])
  }, [habits, today])

  // After adding/editing from the Edit sheet, go back to it.
  const back = () => setSheet(sheet?.from === 'manage' ? { mode: 'manage' } : null)

  function handleSave(values) {
    if (sheet.mode === 'add') {
      update([...habits, { id: makeId(), ...values }])
    } else {
      const habit = { ...sheet.habit, ...values }
      // A new start date: milestones it has already passed are earned quietly (no sheets).
      // Earned milestones are never removed, so a reset keeps them.
      if (values.startDate !== sheet.habit.startDate) storeMilestones(backfillTracker(loadMilestones(), habit, todayISO()))
      update(habits.map((h) => (h.id === sheet.habit.id ? habit : h)))
    }
    back()
  }

  function handleDelete() {
    storeMilestones(removeTracker(loadMilestones(), sheet.habit.id))
    update(habits.filter((h) => h.id !== sheet.habit.id))
    back()
  }

  function handleRange(id) {
    setRange(id)
    saveRange(id)
  }

  const hero = heroHabit(habits)
  const days = cleanDays(hero, today)
  const segment = ringSegment(days)
  const label = ringLabel(days)
  let since = ''
  if (hero) since = hero.startDate > today ? `starts ${shortDate(hero.startDate, today)}` : `since ${shortDate(hero.startDate, today)}`
  // All time starts at the tracker's start date (or the first walk, if that's earlier).
  const firstWalk = walks.reduce((min, w) => (w.startedAt < min ? w.startedAt : min), '9999')
  const allSince = [hero?.startDate, firstWalk === '9999' ? null : todayISO(new Date(firstWalk))].filter(Boolean).sort()[0] || today
  const celebration = celebrations[0]
  const celebrated = celebration && habits.find((h) => h.id === celebration.habitId)

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

      {hero ? (
        <div className="hero-block">
          <HeroRing name={hero.name} days={days} caption={since} progress={segment.progress} celebrate={segment.isToday} />
          <p className="ring-label" data-testid="ring-label">
            <b>{label.lead}</b><span>{label.rest}</span>
          </p>
        </div>
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
        <WalksCard walks={walks} range={range} onRange={handleRange} streak={hero ? days : null} now={now} since={allSince} />
      )}

      {hero && <MilestoneRow data={milestones} habitId={hero.id} onOpen={() => setSheet({ mode: 'milestones' })} />}

      {showNudge && (
        <div className="nudge" data-testid="backup-nudge">
          <span className="nudge-text">Your data lives only on this phone. It’s been a while since your last backup.</span>
          <button className="btn btn-ghost nudge-action" onClick={onOpenBackup}>Back up</button>
          <button className="icon-btn" aria-label="Dismiss backup reminder" onClick={() => { dismissNudge(); setShowNudge(false) }}>✕</button>
        </div>
      )}

      {sheet?.mode === 'milestones' && (
        <MilestonesList data={milestones} habit={hero} today={today} onClose={() => setSheet(null)} />
      )}
      {celebrated && !sheet && (
        <MilestoneSheet
          milestone={celebration.milestone}
          habitName={celebrated.name}
          showName={habits.length > 1}
          onDone={() => setCelebrations((q) => q.slice(1))}
        />
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
