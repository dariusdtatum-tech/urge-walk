import { useState } from 'react'
import { shortDate } from '../lib/homeStats.js'
import {
  IMPORTANCE, IMPROVE, SUPPORT, emptyProfile, identityLine, labelFor, loadProfile, saveProfile,
} from '../lib/profile.js'
import { heroHabit } from '../lib/homeStats.js'
import { earnedList, loadMilestones, saveMilestones } from '../lib/milestones.js'
import { useToday } from '../lib/useToday.js'
import { lengthLabel, loadWalkPrefs, saveWalkPrefs } from '../lib/walkStorage.js'
import AnswerSheet from './AnswerSheet.jsx'
import { MilestonesList } from './Milestones.jsx'
import PageHeader from './PageHeader.jsx'
import { useTrackerEditor } from './useTrackerEditor.jsx'
import WalkLengthPicker from './WalkLengthPicker.jsx'

// The setup answers as You rows (each opens its editor).
function answers(p) {
  const before = [
    p.before.daysPerWeek != null && `${p.before.daysPerWeek} ${p.before.daysPerWeek === 1 ? 'day' : 'days'} a week`,
    p.before.timesPerDay != null && `${p.before.timesPerDay === 7 ? '7+' : p.before.timesPerDay} ${p.before.timesPerDay === 1 ? 'time' : 'times'} a day`,
  ].filter(Boolean).join(' · ')
  return [
    { field: 'before', title: 'Before you started', value: before },
    { field: 'improve', title: 'More of', value: p.improve.map((id) => labelFor(IMPROVE, id)).join(' · ') },
    { field: 'importance', title: 'Right now', value: IMPORTANCE.find((o) => o.id === p.importance)?.recap ?? '' },
    { field: 'identity', title: 'I see myself as', value: identityLine(p) },
    { field: 'support', title: 'Who’s with you', value: p.support ? labelFor(SUPPORT, p.support) + (p.support === 'trusted' ? ` · ${p.trustedName}` : '') : '' },
    { field: 'why', title: 'Your why', value: p.why ? `“${p.why}”` : '' },
  ]
}

// You: trackers (riding out + start dates), the setup answers, Redo setup, the full Milestones list,
// walk length, and Backup & restore.
function YouTab({ onOpenBackup, onRedo = () => {} }) {
  const today = useToday()
  const [milestones, setMilestones] = useState(() => loadMilestones())
  const editor = useTrackerEditor({
    today, onOpenBackup, onMilestones: (next) => { saveMilestones(next); setMilestones(next) },
  })
  const { habits, notice, setNotice, sheet, setSheet } = editor
  const [prefs, setPrefs] = useState(() => loadWalkPrefs())
  const [showLengths, setShowLengths] = useState(false)
  const [profile, setProfile] = useState(() => loadProfile() || emptyProfile())
  const [answer, setAnswer] = useState(null) // which setup answer is being edited
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

      <section className="you-answers" aria-labelledby="answers-title">
        <h2 className="you-section" id="answers-title">Your answers</h2>
        {answers(profile).map((a) => (
          <button key={a.field} className="settings-row" data-testid={`answer-${a.field}`} onClick={() => setAnswer(a.field)}>
            <span>
              <span className="settings-row-title">{a.title}</span>
              <span className={a.value ? 'settings-row-sub' : 'settings-row-sub you-unset'}>{a.value || 'Not set'}</span>
            </span>
            <span aria-hidden="true">›</span>
          </button>
        ))}
        <button className="settings-row" data-testid="redo-setup" onClick={onRedo}>
          <span>
            <span className="settings-row-title">Redo setup</span>
            <span className="settings-row-sub">Go through the questions again{profile.onboardedAt && !profile.skipped ? ` · last done ${shortDate(profile.onboardedAt.slice(0, 10), today)}` : ''}</span>
          </span>
          <span aria-hidden="true">›</span>
        </button>
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
      {answer && (
        <AnswerSheet
          field={answer}
          profile={profile}
          onClose={() => setAnswer(null)}
          onSave={(changes) => {
            const next = { ...profile, ...changes }
            saveProfile(next)
            setProfile(loadProfile() || next)
            setAnswer(null)
          }}
        />
      )}
    </div>
  )
}

export default YouTab
