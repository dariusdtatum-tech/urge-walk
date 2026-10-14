import { useState } from 'react'
import { shortDate } from '../lib/homeStats.js'
import {
  IMPORTANCE, IMPROVE, SUPPORT, communityAvailable, emptyProfile, trustedContact, identityLine, labelFor, loadProfile, saveProfile,
} from '../lib/profile.js'
import { heroHabit } from '../lib/homeStats.js'
import { earnedList, loadMilestones, saveMilestones } from '../lib/milestones.js'
import { useToday } from '../lib/useToday.js'
import { lengthLabel, loadWalkPrefs, saveWalkPrefs } from '../lib/walkStorage.js'
import AnswerSheet from './AnswerSheet.jsx'
import Community from './Community.jsx'
import ConfirmDialog from './ConfirmDialog.jsx'
import { backupFilename, buildBackup, clearAllData, lastBackupLabel, loadBackupMeta, shareOrDownload } from '../lib/backup.js'
import CrisisSheet from './CrisisSheet.jsx'
import { TimeBackCard } from './TimeBack.jsx'
import { MilestonesList } from './Milestones.jsx'
import PageHeader from './PageHeader.jsx'
import { useTrackerEditor } from './useTrackerEditor.jsx'
import WalkLengthPicker from './WalkLengthPicker.jsx'
import LegalLinks from './LegalLinks.jsx'

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

// One settings row (title, optional sub-line, chevron).
function Row({ title, sub, onClick, testId, danger }) {
  return (
    <button className={danger ? 'settings-row you-row-danger' : 'settings-row'} data-testid={testId} onClick={onClick}>
      <span>
        <span className="settings-row-title">{title}</span>
        {sub && <span className="settings-row-sub">{sub}</span>}
      </span>
      <span aria-hidden="true">›</span>
    </button>
  )
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
  const [showCommunity, setShowCommunity] = useState(false)
  const [showCrisis, setShowCrisis] = useState(false)
  const [showAnswers, setShowAnswers] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const hero = heroHabit(habits)
  const earned = hero ? earnedList(milestones, hero.id).length : 0

  function changePrefs(next) {
    setPrefs(next)
    saveWalkPrefs(next)
  }

  function changeProfile(changes) {
    const next = { ...profile, ...changes }
    saveProfile(next)
    setProfile(loadProfile() || next)
  }

  if (showCommunity) return <Community onBack={() => setShowCommunity(false)} />

  const contact = trustedContact(profile)
  const list = answers(profile)
  const answered = list.filter((a) => a.value).length

  async function resetApp() {
    setConfirmReset(false)
    const now = Date.now()
    const text = JSON.stringify(buildBackup(localStorage, now), null, 2)
    let outcome = 'cancelled'
    try { outcome = await shareOrDownload(text, backupFilename(now)) } catch { outcome = 'failed' }
    if (outcome !== 'shared' && outcome !== 'downloaded') {
      setNotice('Nothing was erased: the backup file wasn’t saved.')
      return
    }
    clearAllData()
    window.location.reload()
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

      <section className="you-group" aria-labelledby="g-help">
        <h2 className="you-group-title" id="g-help">Help now</h2>
        <Row title="Crisis resources" sub="988, SAMHSA helpline, 911" testId="crisis-row" onClick={() => setShowCrisis(true)} />
        {contact && (
          <a className="settings-row" href={contact.href} data-testid="you-text-contact">
            <span>
              <span className="settings-row-title">Text {contact.name}</span>
              <span className="settings-row-sub">Your trusted person</span>
            </span>
            <span aria-hidden="true">›</span>
          </a>
        )}
      </section>

      <section className="you-group" aria-labelledby="g-recovery">
        <h2 className="you-group-title" id="g-recovery">Your recovery</h2>
        <Row title="Trackers" sub={habits.length === 0 ? 'Add the date you started' : habits.map((h) => h.name).join(' · ')}
          onClick={() => setSheet({ mode: 'manage' })} />
        {hero && (
          <Row title="Milestones" sub={`${earned === 1 ? '1 earned' : `${earned} earned`} · ${hero.name}`}
            onClick={() => setSheet({ mode: 'milestones' })} />
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
        <TimeBackCard profile={profile} hero={hero} today={today} onChange={changeProfile} />
      </section>

      <section className="you-group you-answers" aria-labelledby="answers-title">
        <h2 className="you-group-title" id="answers-title">About you</h2>
        <button className="settings-row" aria-expanded={showAnswers} data-testid="answers-toggle" onClick={() => setShowAnswers(!showAnswers)}>
          <span>
            <span className="settings-row-title">Your answers</span>
            <span className="settings-row-sub">{answered} of {list.length} answered</span>
          </span>
          <span aria-hidden="true">{showAnswers ? '⌃' : '›'}</span>
        </button>
        {showAnswers && list.map((a) => (
          <button key={a.field} className="settings-row" data-testid={`answer-${a.field}`} onClick={() => setAnswer(a.field)}>
            <span>
              <span className="settings-row-title">{a.title}</span>
              <span className={a.value ? 'settings-row-sub' : 'settings-row-sub you-unset'}>{a.value || 'Not set'}</span>
            </span>
            <span aria-hidden="true">›</span>
          </button>
        ))}
        <Row title="Redo setup" testId="redo-setup" onClick={onRedo}
          sub={`Go through the questions again${profile.onboardedAt && !profile.skipped ? ` · last done ${shortDate(profile.onboardedAt.slice(0, 10), today)}` : ''}`} />
      </section>

      <section className="you-group" aria-labelledby="g-data">
        <h2 className="you-group-title" id="g-data">Your data</h2>
        <Row title="Backup & restore" sub={lastBackupLabel(loadBackupMeta())} testId="backup-row" onClick={onOpenBackup} />
        <Row title="Reset app" sub="Saves a backup file first, then starts fresh" testId="reset-app" danger onClick={() => setConfirmReset(true)} />
      </section>

      <section className="you-group" aria-labelledby="g-about">
        <h2 className="you-group-title" id="g-about">About</h2>
        {communityAvailable() && (
          <Row title="Community" sub="You’re not alone. House rules, what’s inside, Discord." testId="community-row" onClick={() => setShowCommunity(true)} />
        )}
        <p className="you-footnote">No ads. No tracking. For now, everything stays on this phone.</p>
        <LegalLinks />
      </section>

      {confirmReset && (
        <div data-testid="reset-app-dialog">
          <ConfirmDialog
            title="Reset Urge Walk?"
            message="First we’ll save a backup file. Then everything Urge Walk keeps on this phone is erased and setup starts again. If the backup isn’t saved, nothing is erased."
            confirmLabel="Save backup and reset"
            cancelLabel="Keep my data"
            onCancel={() => setConfirmReset(false)}
            onConfirm={resetApp}
          />
        </div>
      )}

      {sheet?.mode === 'milestones' && hero && (
        <MilestonesList data={milestones} habit={hero} today={today} onClose={() => setSheet(null)} />
      )}
      {editor.sheets}
      {showCrisis && <CrisisSheet onClose={() => setShowCrisis(false)} />}
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
