import { useEffect, useState } from 'react'
import { dismissNudge, loadBackupMeta, shouldNudge } from '../lib/backup.js'
import { todayISO } from '../lib/cleanTime.js'
import { cleanDays, heroHabit, loadRange, saveRange, shortDate } from '../lib/homeStats.js'
import { loadMilestones, ringLabel, ringSegment, saveMilestones, syncMilestones } from '../lib/milestones.js'
import { loadJournal } from '../lib/journal.js'
import { bannerDismissed, dismissBanner, isCalm, recentlySaved } from '../lib/calm.js'
import { undoableReset } from '../lib/homeIdeas.js'
import { identityLine, loadProfile } from '../lib/profile.js'
import { useNow, useToday } from '../lib/useToday.js'
import { loadActiveWalk, loadWalks } from '../lib/walkStorage.js'
import HeroPager from './HeroPager.jsx'
import NeverZero from './NeverZero.jsx'
import { MilestoneSheet } from './Milestones.jsx'
import { SunriseIcon } from './Icons.jsx'
import RideBar from './RideBar.jsx'
import UndoBanner from './UndoBanner.jsx'
import { useTrackerEditor } from './useTrackerEditor.jsx'
import WalksCard from './WalksCard.jsx'

// Home: one ring for the main tracker (progress toward its next milestone), the "Your walks" card
// (Week / Month / All time changes only the card) and the Milestones badge row.
// Reaching a milestone shows one calm sheet, once per milestone per tracker.
function HomeTab({ onUrge, onOpenBackup, onRide = () => {} }) {
  const today = useToday()
  const now = useNow()
  // Load saved data once, when the tab first appears.
  const [walks] = useState(() => loadWalks().walks)
  const [profile] = useState(() => loadProfile())
  // Trackers + the Edit sheets (shared with the You tab).
  const editor = useTrackerEditor({ today, onOpenBackup, onMilestones: (next) => storeMilestones(next) })
  const { habits, notice, setNotice, sheet, setSheet } = editor
  // Week / Month / All time: changes the walks card only, never the ring. Remembered.
  const [range, setRange] = useState(() => loadRange())
  const [milestones, setMilestones] = useState(() => loadMilestones())
  // Milestone sheets waiting to be shown: [{ habitId, milestone }]
  const [celebrations, setCelebrations] = useState([])
  const walkInProgress = loadActiveWalk() != null
  // Gentle backup reminder (data only lives on this phone)
  // ...held back for 30 minutes after a stressful moment (Ride it out, a walk or breath, a reset).
  const [showNudge, setShowNudge] = useState(() => isCalm() && shouldNudge(
    loadBackupMeta(),
    habits.length > 0 || walks.length > 0 || loadJournal().entries.length > 0,
  ))
  // Closure: right after a save, the "urges ridden out" number is highlighted for a moment.
  const [highlight] = useState(() => recentlySaved())
  const [, setBannerTick] = useState(0)

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
      <header className="home-top">
        <h1 className="visually-hidden">Home</h1>
        <p className="home-date">{new Date(now).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
        <button className="header-link" onClick={() => setSheet({ mode: 'manage' })}>Edit</button>
      </header>
      {identityLine(profile) && <p className="page-subline home-identity" data-testid="identity-line">{identityLine(profile)}</p>}

      {habits.map((h) => {
        const u = undoableReset(h, now)
        if (!u || bannerDismissed(h.resets.at(-1).at)) return null
        return (
          <UndoBanner key={h.id} habit={h} until={u.until} now={now} today={today} showName={habits.length > 1}
            onUndo={() => editor.undoLast(h.id)}
            onDismiss={() => { dismissBanner(h.resets.at(-1).at); setBannerTick((t) => t + 1) }} />
        )
      })}

      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
          <button className="icon-btn" onClick={() => setNotice('')} aria-label="Dismiss">✕</button>
        </div>
      )}

      <RideBar live={walkInProgress} onRide={onRide} onResume={onUrge} />

      {hero ? (
        <HeroPager hero={hero} days={days} since={since} segment={segment} label={label} milestones={milestones} today={today} profile={profile} />
      ) : (
        <section className="empty" data-testid="home-empty">
          <span className="empty-mark" aria-hidden="true"><SunriseIcon /></span>
          <h2>Every day counts</h2>
          <p>Add your start date to begin counting.</p>
          <button className="btn btn-primary btn-big" onClick={() => setSheet({ mode: 'add' })}>Add your start date</button>
          <button className="btn btn-ghost empty-restore" onClick={onOpenBackup}>Restore from a backup</button>
        </section>
      )}

      {hero && <NeverZero hero={hero} walks={walks} today={today} highlight={highlight} />}

      {(hero || walks.length > 0) && (
        <WalksCard walks={walks} range={range} onRange={handleRange} streak={hero ? days : null} now={now} since={allSince} />
      )}


      {showNudge && (
        <div className="nudge" data-testid="backup-nudge">
          <span className="nudge-text">Your data lives only on this phone. It’s been a while since your last backup.</span>
          <button className="btn btn-ghost nudge-action" onClick={onOpenBackup}>Back up</button>
          <button className="icon-btn" aria-label="Dismiss backup reminder" onClick={() => { dismissNudge(); setShowNudge(false) }}>✕</button>
        </div>
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
