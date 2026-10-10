import { useState } from 'react'
import { heroHabit } from '../lib/homeStats.js'
import { earnedList, loadMilestones, saveMilestones } from '../lib/milestones.js'
import { useToday } from '../lib/useToday.js'
import { lengthLabel, loadWalkPrefs, saveWalkPrefs } from '../lib/walkStorage.js'
import { MilestonesList } from './Milestones.jsx'
import PageHeader from './PageHeader.jsx'
import { useTrackerEditor } from './useTrackerEditor.jsx'
import WalkLengthPicker from './WalkLengthPicker.jsx'

// You: trackers, the full Milestones list, walk length, and Backup & restore.
function YouTab({ onOpenBackup }) {
  const today = useToday()
  const [milestones, setMilestones] = useState(() => loadMilestones())
  const editor = useTrackerEditor({
    today, onOpenBackup, onMilestones: (next) => { saveMilestones(next); setMilestones(next) },
  })
  const { habits, notice, setNotice, sheet, setSheet } = editor
  const [prefs, setPrefs] = useState(() => loadWalkPrefs())
  const [showLengths, setShowLengths] = useState(false)
  const hero = heroHabit(habits)
  const earned = hero ? earnedList(milestones, hero.id).length : 0

  function changePrefs(next) {
    setPrefs(next)
    saveWalkPrefs(next)
  }

  return (
    <div className="you">
      <PageHeader title="You" />
      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
          <button className="icon-btn" onClick={() => setNotice('')} aria-label="Dismiss">✕</button>
        </div>
      )}

      <button className="settings-row" onClick={() => setSheet({ mode: 'manage' })}>
        <span>
          <span className="settings-row-title">Trackers</span>
          <span className="settings-row-sub">
            {habits.length === 0 ? 'Add the date you started' : habits.map((h) => h.name).join(' · ')}
          </span>
        </span>
        <span aria-hidden="true">›</span>
      </button>

      {hero && (
        <button className="settings-row" onClick={() => setSheet({ mode: 'milestones' })}>
          <span>
            <span className="settings-row-title">Milestones</span>
            <span className="settings-row-sub">{earned === 1 ? '1 earned' : `${earned} earned`} · {hero.name}</span>
          </span>
          <span aria-hidden="true">›</span>
        </button>
      )}

      <section className="you-card" aria-labelledby="length-title">
        <button className="settings-row settings-row-flat" aria-expanded={showLengths} aria-controls="walk-options"
          onClick={() => setShowLengths(!showLengths)}>
          <span>
            <span className="settings-row-title" id="length-title">Walk length</span>
            <span className="settings-row-sub" data-testid="walk-length">{lengthLabel(prefs)} · for Walk</span>
          </span>
          <span aria-hidden="true">{showLengths ? '⌃' : '›'}</span>
        </button>
        {showLengths && <WalkLengthPicker prefs={prefs} onChangePrefs={changePrefs} />}
      </section>

      <button className="settings-row" onClick={onOpenBackup}>
        <span>
          <span className="settings-row-title">Backup &amp; restore</span>
          <span className="settings-row-sub">Save everything to a file, or bring it back</span>
        </span>
        <span aria-hidden="true">›</span>
      </button>

      <p className="you-footnote">Everything stays on this phone. No account, no tracking.</p>

      {sheet?.mode === 'milestones' && hero && (
        <MilestonesList data={milestones} habit={hero} today={today} onClose={() => setSheet(null)} />
      )}
      {editor.sheets}
    </div>
  )
}

export default YouTab
