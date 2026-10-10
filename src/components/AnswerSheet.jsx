import { useState } from 'react'
import { supportValid } from '../lib/profile.js'
import { useSwipeDown } from '../lib/useSwipeDown.js'
import { IdentityStep, ImportanceStep, ImproveStep, StepperStep, SupportStep, WhyStep } from './OnboardingSteps.jsx'

// Edit one setup answer from You (same editors as onboarding). Saves only on Save.
const ANSWER_FIELDS = {
  before: 'Before you started',
  improve: 'What you want more of',
  importance: 'How important right now',
  identity: 'I see myself as',
  support: 'Who’s with you',
  why: 'Your why',
}

function AnswerSheet({ field, profile, onSave, onClose }) {
  const swipe = useSwipeDown(onClose)
  const [value, setValue] = useState(() => {
    if (field === 'before') return { ...profile.before }
    if (field === 'support') return { support: profile.support, trustedName: profile.trustedName, trustedPhone: profile.trustedPhone }
    return profile[field]
  })
  const ok = field !== 'support' || supportValid(value)

  function save() {
    if (field === 'before') onSave({ before: value })
    else if (field === 'support') onSave(value.support === 'trusted' ? value : { ...value, trustedName: '', trustedPhone: '' })
    else onSave({ [field]: value })
  }

  let editor
  if (field === 'before') {
    editor = (
      <>
        <p className="ob-sheet-label">Days a week</p>
        <StepperStep testId="ans-dpw" value={value.daysPerWeek} min={0} max={7} unit="days a week" marks={['M', 'T', 'W', 'T', 'F', 'S', 'S']} onChange={(daysPerWeek) => setValue({ ...value, daysPerWeek })} />
        <p className="ob-sheet-label">Times a day</p>
        <StepperStep testId="ans-tpd" value={value.timesPerDay} min={1} max={7} unit="times a day" marks={['1', '2', '3', '4', '5', '6', '7+']} onChange={(timesPerDay) => setValue({ ...value, timesPerDay })} />
        <button type="button" className="ob-link" onClick={() => setValue({ daysPerWeek: null, timesPerDay: null })}>Clear</button>
      </>
    )
  } else if (field === 'improve') editor = <ImproveStep value={value} onChange={setValue} />
  else if (field === 'importance') editor = <ImportanceStep value={value} onChange={setValue} />
  else if (field === 'identity') editor = <IdentityStep value={value} onChange={setValue} />
  else if (field === 'support') editor = <SupportStep value={value} onChange={setValue} />
  else editor = <WhyStep value={value} onChange={setValue} autoFocus={false} />

  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet answer-sheet" role="dialog" aria-modal="true" aria-labelledby="answer-title"
        data-testid="answer-sheet" onClick={(e) => e.stopPropagation()} {...swipe}>
        <div className="sheet-handle" aria-hidden="true" />
        <h2 id="answer-title">{ANSWER_FIELDS[field]}</h2>
        <div className="answer-body">{editor}</div>
        <div className="sheet-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" disabled={!ok} onClick={save}>Save</button>
        </div>
      </div>
    </div>
  )
}

export default AnswerSheet
