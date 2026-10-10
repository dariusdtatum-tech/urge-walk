import { useState } from 'react'
import { daysBetween, todayISO } from '../lib/cleanTime.js'
import { shortDate } from '../lib/homeStats.js'
import { backfillTracker, loadMilestones, saveMilestones } from '../lib/milestones.js'
import {
  IMPORTANCE, IMPROVE, SUPPORT, emptyProfile, identityLine, labelFor, loadProfile, saveProfile, supportValid,
  trackersFromPicks,
} from '../lib/profile.js'
import { loadHabits, makeId, saveHabits } from '../lib/storage.js'
import {
  DateStep, IdentityStep, ImportanceStep, ImproveStep, RidingStep, StepperStep, SupportStep, WhyStep,
} from './OnboardingSteps.jsx'

const TOTAL = 12
const line = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
const PRIVACY = [
  { id: 'account', title: 'No account', text: 'Nothing to sign up for. No email, no password.', icon: <svg {...line}><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.8-3.6 3.6-5.6 7-5.6s6.2 2 7 5.6" /><path d="M4 4l16 16" /></svg> },
  { id: 'tracking', title: 'No tracking', text: 'No ads, no analytics, no location history.', icon: <svg {...line}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.5" /><path d="M4 4l16 16" /></svg> },
  { id: 'file', title: 'Your backup, your file', text: 'Export or restore whenever you want.', icon: <svg {...line}><path d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19.5h14" /></svg> },
]
const Check = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5 10 17 19 7" /></svg>

function joinNames(names) {
  if (names.length <= 1) return names[0] || ''
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
}

// The welcome scene: sun (moon at night) over layered sea-glass waves. Colours come from the theme.
function WelcomeScene() {
  return (
    <svg className="ob-hero" viewBox="0 0 390 520" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ob-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--ob-sky-a)' }} /><stop offset="1" style={{ stopColor: 'var(--ob-sky-b)' }} />
        </linearGradient>
        <linearGradient id="ob-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset=".7" style={{ stopColor: 'var(--bg)', stopOpacity: 0 }} /><stop offset="1" style={{ stopColor: 'var(--bg)' }} />
        </linearGradient>
      </defs>
      <rect width="390" height="520" fill="url(#ob-sky)" />
      <circle className="ob-sun" cx="270" cy="150" r="46" />
      <path className="ob-w1" d="M0 250 C 80 238 160 262 240 248 C 300 238 350 252 390 244 L390 520 L0 520Z" />
      <path className="ob-w2" d="M0 300 C 90 280 170 318 250 298 C 320 282 360 300 390 292 L390 520 L0 520Z" />
      <path className="ob-w3" d="M0 352 C 100 334 180 372 260 352 C 330 336 365 352 390 346 L390 520 L0 520Z" />
      <path className="ob-foam" d="M0 352 C 100 334 180 372 260 352 C 330 336 365 352 390 346" />
      <path className="ob-w4" d="M0 404 C 110 390 190 420 280 404 C 340 394 370 404 390 400 L390 520 L0 520Z" />
      <rect width="390" height="520" fill="url(#ob-fade)" />
    </svg>
  )
}

// 12 screens, one question each. mode 'new' (first run) or 'redo' (from You; answers prefilled,
// trackers that already exist are kept and not duplicated). Nothing is saved until "Let's walk".
function Onboarding({ mode = 'new', onDone, onRestore, onCancel }) {
  const today = todayISO()
  const [draft, setDraft] = useState(() => {
    const p = loadProfile() || emptyProfile()
    const habits = loadHabits().habits
    return {
      adult: p.adultConfirmed,
      picks: mode === 'redo' ? habits.map((h) => h.name) : [],
      startDate: mode === 'redo' && habits[0] ? habits[0].startDate : today,
      daysPerWeek: p.before.daysPerWeek, timesPerDay: p.before.timesPerDay,
      improve: p.improve, importance: p.importance, identity: p.identity,
      support: { support: p.support, trustedName: p.trustedName, trustedPhone: p.trustedPhone },
      why: p.why,
      existing: habits.map((h) => h.name),
    }
  })
  const [step, setStep] = useState(mode === 'redo' ? 2 : 1)
  const [fromRecap, setFromRecap] = useState(false)
  const set = (changes) => setDraft((d) => ({ ...d, ...changes }))
  const newPicks = draft.picks.filter((n) => !draft.existing.some((e) => e.toLowerCase() === n.toLowerCase()))

  const next = () => { setStep(fromRecap ? 12 : step + 1); if (fromRecap) setFromRecap(false) }
  const back = () => {
    if (fromRecap) { setFromRecap(false); setStep(12); return }
    if (step === 1 || (mode === 'redo' && step === 2)) { onCancel?.(); return }
    setStep(step - 1)
  }
  // Skip keeps the default (date = today) or leaves the answer empty.
  const SKIP_RESET = {
    4: { startDate: today }, 5: { daysPerWeek: null }, 6: { timesPerDay: null }, 7: { improve: [] },
    8: { importance: null }, 9: { identity: null }, 10: { support: { support: null, trustedName: '', trustedPhone: '' } }, 11: { why: '' },
  }
  const skip = () => { set(SKIP_RESET[step]); next() }
  const edit = (n) => { setFromRecap(true); setStep(n) }

  function finish() {
    // Runs on the "Let’s walk" tap, not during render.
    // eslint-disable-next-line react/purity
    const now = new Date().toISOString()
    const prev = loadProfile() || emptyProfile()
    saveProfile({
      ...prev, onboardedAt: now, skipped: false, adultConfirmed: true, privacyAckAt: prev.privacyAckAt || now,
      before: { daysPerWeek: draft.daysPerWeek, timesPerDay: draft.timesPerDay },
      improve: draft.improve, importance: draft.importance, identity: draft.identity,
      ...draft.support, why: draft.why,
    })
    const habits = loadHabits().habits
    const added = trackersFromPicks(draft.picks, draft.startDate, habits, makeId)
    if (added.length) {
      saveHabits([...habits, ...added])
      // Milestones the start date has already passed are earned quietly (no celebration sheets).
      let m = loadMilestones()
      for (const h of added) m = backfillTracker(m, h, today)
      saveMilestones(m)
    }
    onDone()
  }

  const days = Math.max(0, daysBetween(draft.startDate, today))
  const dateNote = mode === 'redo' && newPicks.length === 0
    ? 'Your trackers keep their own dates. Change them in You → Trackers.'
    : `One date for ${joinNames(mode === 'redo' ? newPicks : draft.picks) || 'everything you picked'}. You can change each later.`

  const screens = {
    2: { title: 'Everything stays on this phone.', cta: 'Sounds good', ok: draft.adult,
      body: (
        <>
          <div className="ob-pv">
            {PRIVACY.map((r) => (
              <div key={r.id}><span className="ob-pic">{r.icon}</span><span><b>{r.title}</b><span>{r.text}</span></span></div>
            ))}
          </div>
          <label className={draft.adult ? 'ob-chk on' : 'ob-chk'}>
            <input type="checkbox" checked={draft.adult} onChange={(e) => set({ adult: e.target.checked })} />
            <span className="ob-box" aria-hidden="true">{draft.adult && <Check />}</span>
            I’m 18 or older
          </label>
        </>
      ) },
    3: { title: 'What are you riding out?', sub: 'Choose all that apply. You can add more later.', ok: draft.picks.length > 0, scroll: true,
      body: <RidingStep picks={draft.picks} onChange={(picks) => set({ picks })} /> },
    4: { title: 'When did your clean days begin?', sub: dateNote, extra: <button type="button" className="ob-link" onClick={() => set({ startDate: today })}>Start today</button>,
      body: <DateStep value={draft.startDate} today={today} onChange={(startDate) => set({ startDate })} /> },
    5: { title: 'Before you started, how many days a week?', sub: 'Optional. Helps show the time you’ve gained back.',
      body: <StepperStep testId="ob-dpw" value={draft.daysPerWeek} min={0} max={7} unit="days a week" marks={['M', 'T', 'W', 'T', 'F', 'S', 'S']} onChange={(daysPerWeek) => set({ daysPerWeek })} /> },
    6: { title: 'On those days, how many times a day?', sub: 'Optional. A rough guess is fine.',
      body: <StepperStep testId="ob-tpd" value={draft.timesPerDay} min={1} max={7} unit="times a day" marks={['1', '2', '3', '4', '5', '6', '7+']} onChange={(timesPerDay) => set({ timesPerDay })} /> },
    7: { title: 'What do you want more of?', sub: 'We’ll shape your walk encouragement around these.',
      body: <ImproveStep value={draft.improve} onChange={(improve) => set({ improve })} /> },
    8: { title: 'How important is this to you right now?', sub: 'Be honest. It only changes how the app shows up for you.',
      body: <ImportanceStep value={draft.importance} onChange={(importance) => set({ importance })} /> },
    9: { title: 'I see myself as someone who is…', sub: 'Shown on your Home screen.',
      body: <IdentityStep value={draft.identity} onChange={(identity) => set({ identity })} /> },
    10: { title: 'Who’s with you?', sub: 'Riding it out is easier with company. Or not. Your call.', ok: supportValid(draft.support), scroll: true,
      body: <SupportStep value={draft.support} onChange={(support) => set({ support })} /> },
    11: { title: 'Why does this matter to you?',
      body: <WhyStep value={draft.why} onChange={(why) => set({ why })} /> },
  }

  const before = [
    draft.daysPerWeek != null && `${draft.daysPerWeek} ${draft.daysPerWeek === 1 ? 'day' : 'days'} a week`,
    draft.timesPerDay != null && `${draft.timesPerDay === 7 ? '7+' : draft.timesPerDay} ${draft.timesPerDay === 1 ? 'time' : 'times'} a day`,
  ].filter(Boolean).join(' · ')
  const sup = draft.support.support
  const recap = [
    { step: 3, k: 'Riding out', v: draft.picks.join(', ') },
    { step: 4, k: 'Clean since', v: `${shortDate(draft.startDate, '0000-01-01')} · ${days.toLocaleString()} ${days === 1 ? 'day' : 'days'}` },
    { step: 5, k: 'Before', v: before },
    { step: 7, k: 'More of', v: draft.improve.map((id) => labelFor(IMPROVE, id)).join(' · ') },
    { step: 8, k: 'Right now', v: IMPORTANCE.find((o) => o.id === draft.importance)?.recap ?? '' },
    { step: 9, k: 'I see myself as', v: identityLine({ identity: draft.identity }) },
    { step: 10, k: 'Who’s with you', v: sup ? labelFor(SUPPORT, sup) + (sup === 'trusted' ? ` · ${draft.support.trustedName.trim()}` : '') : '' },
    { step: 11, k: 'Your why', v: draft.why.trim() ? `“${draft.why.trim().replace(/[.!?]?$/, '.')}”` : '', why: true },
  ]

  if (step === 1) {
    return (
      <div className="ob ob-welcome" data-testid="onboarding" data-step="1">
        {mode === 'redo' && <button type="button" className="ob-back ob-back-float" aria-label="Back" onClick={onCancel}>‹</button>}
        <WelcomeScene />
        <div className="ob-wl">
          <h1 className="ob-title-xl">You’re here.</h1>
          <p className="page-tagline ob-tagline">That’s the first step.</p>
          <p className="ob-lead">Urge Walk helps you ride out urges, one walk at a time. Private, on your phone.</p>
        </div>
        <div className="ob-foot">
          <button type="button" className="btn btn-primary ob-pbtn" onClick={() => setStep(2)}>Begin</button>
          {mode === 'new' && <button type="button" className="ob-link" onClick={onRestore}>Restore from a backup</button>}
        </div>
      </div>
    )
  }

  const progress = (
    <div className="ob-top">
      <button type="button" className="ob-back" aria-label="Back" onClick={back}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
      </button>
      <div className="ob-pbar" role="progressbar" aria-label="Setup progress" aria-valuemin={1} aria-valuemax={TOTAL} aria-valuenow={step}>
        <i style={{ width: `${(step / TOTAL) * 100}%` }} />
      </div>
      {step >= 4 && step <= 11 ? <button type="button" className="ob-skip" onClick={skip}>Skip</button> : <span className="ob-skip-space" />}
    </div>
  )

  if (step === 12) {
    return (
      <div className="ob" data-testid="onboarding" data-step="12">
        {progress}
        <div className="ob-q">
          <h1>Look at what you just did.</h1>
          <p>Every answer is yours to change in You.</p>
        </div>
        <ul className="ob-recap">
          {recap.map((r) => (
            <li key={r.k}>
              <button type="button" className="ob-rr" data-testid={`recap-${r.step}`} onClick={() => edit(r.step)} aria-label={`${r.k}: ${r.v || 'Not set'}. Edit`}>
                <span className={r.v ? 'ob-rck' : 'ob-rck off'} aria-hidden="true">{r.v && <Check />}</span>
                <span><b>{r.k}</b><span className={r.why && r.v ? 'ob-rv ob-why' : r.v ? 'ob-rv' : 'ob-rv ob-unset'}>{r.v || 'Not set · tap to add'}</span></span>
              </button>
            </li>
          ))}
        </ul>
        <div className="ob-foot">
          <button type="button" className="btn btn-primary ob-pbtn" onClick={finish}>Let’s walk</button>
        </div>
      </div>
    )
  }

  const sc = screens[step]
  return (
    <div className={sc.scroll ? 'ob ob-has-scroll' : 'ob'} data-testid="onboarding" data-step={step}>
      {progress}
      <div className="ob-q">
        <h1>{sc.title}</h1>
        {sc.sub && <p>{sc.sub}</p>}
      </div>
      <div className="ob-body">{sc.body}</div>
      <div className="ob-foot">
        <button type="button" className="btn btn-primary ob-pbtn" disabled={sc.ok === false} onClick={next}>
          {fromRecap ? 'Done' : sc.cta || 'Next'}
        </button>
        {sc.extra}
      </div>
    </div>
  )
}

export default Onboarding
