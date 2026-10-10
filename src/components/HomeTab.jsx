import { useEffect, useState } from 'react'
import { dismissNudge, loadBackupMeta, shouldNudge } from '../lib/backup.js'
import { todayISO } from '../lib/cleanTime.js'
import { cleanDays, heroHabit, loadRange, saveRange, shortDate } from '../lib/homeStats.js'
import { loadMilestones, ringLabel, ringSegment, saveMilestones, syncMilestones } from '../lib/milestones.js'
import { loadJournal } from '../lib/journal.js'
import { isIOS } from '../lib/persist.js'
import { useNow, useToday } from '../lib/useToday.js'
import { loadActiveWalk, loadWalks } from '../lib/walkStorage.js'
import HeroRing from './HeroRing.jsx'
import { MilestoneRow, MilestoneSheet, MilestonesList } from './Milestones.jsx'
import PageHeader from './PageHeader.jsx'
import { useTrackerEditor } from './useTrackerEditor.jsx'
import WalksCard from './WalksCard.jsx'

// Home: one ring for the main tracker (progress toward its next milestone), the "Your walks" card
// (Week / Month / All time changes only the card) and the Milestones badge row.
// Reaching a milestone shows one calm sheet, once per milestone per tracker.
function HomeTab({ onUrge, onOpenBackup }) {
  const today = useToday()
  const now = useNow()
  // Load saved data once, when the tab first appears.
  const [walks] = useState(() => loadWalks().walks)
  // Trackers + the Edit sheets (shared with the You tab). Home adds { mode: 'milestones' } for the list.
  const editor = useTrackerEditor({ today, onOpenBackup, onMilestones: (next) => storeMilestones(next) })
  const { habits, notice, setNotice, sheet, setSheet } = editor
  // Week / Month / All time: changes the walks card only, never the ring. Remembered.
  const [range, setRange] = useState(() => loadRange())
  const [milestones, setMilestones] = useState(() => loadMilestones())
  // Milestone sheets waiting to be shown: [{ habitId, milestone }]
  const [celebrations, setCelebrations] = useState([])
  const walkInProgress = loadActiveWalk() != null
  // Gentle backup reminder (data only lives on this phone)
  const [showNudge, setShowNudge] = useState(() => shouldNudge(
    loadBackupMeta(),
    habits.length > 0 || walks.length > 0 || loadJournal().entries.length > 0,
  ))

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
      {editor.sheets}
    </div>
  )
}

export default HomeTab
