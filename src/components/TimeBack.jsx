import { useState } from 'react'
import { DEFAULT_HOURS_PER_TIME, timeBack } from '../lib/homeIdeas.js'
import { shortDate } from '../lib/homeStats.js'
import { useSwipeDown } from '../lib/useSwipeDown.js'

const fmtHours = (h) => (h === 1 ? '1 hour' : `${h} hours`)
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

// Time back: an estimate from the setup answers. Hidden when days a week or times a day were skipped.
// Money is off until the person adds a $ per time.
export function TimeBackCard({ profile, hero, today, onChange }) {
  const [adjust, setAdjust] = useState(null) // null | 'hours' | 'money'
  const tb = timeBack(profile, hero, today)
  if (!tb) return null
  return (
    <section className="card time-back" data-testid="time-back" aria-labelledby="tb-title">
      <div className="tb-h">
        <h2 id="tb-title">Time back</h2>
        <span className="tb-chip">Estimate</span>
      </div>
      <p className="tb-v"><span className="tb-about">about</span> <b data-testid="tb-hours">{tb.hours.toLocaleString()}</b> <span>hours</span></p>
      {tb.money != null && (
        <p className="tb-v tb-money"><span className="tb-about">and about</span> <b data-testid="tb-money">${tb.money.toLocaleString()}</b> <span>kept</span></p>
      )}
      <p className="tb-f" data-testid="tb-formula">
        Since {shortDate(hero.startDate, '0000-01-01')}, based on what you told us: {plural(tb.daysPerWeek, 'day', 'days')} a week,{' '}
        {tb.timesPerDay === 7 ? '7+ times' : plural(tb.timesPerDay, 'time', 'times')} a day, about {fmtHours(tb.hoursPerTime)} each
        {tb.moneyPerTime != null ? ` and $${tb.moneyPerTime} each time` : ''}.
      </p>
      <div className="tb-ln">
        <button type="button" className="tb-link" onClick={() => setAdjust('money')}>{tb.moneyPerTime == null ? 'Add money estimate' : 'Change money'}</button>
        <button type="button" className="tb-link" onClick={() => setAdjust('hours')}>Adjust</button>
      </div>
      {adjust && (
        <AdjustSheet
          kind={adjust}
          value={adjust === 'hours' ? tb.hoursPerTime : tb.moneyPerTime}
          onClose={() => setAdjust(null)}
          onSave={(v) => {
            const cur = profile.timeBack || { hoursPerTime: DEFAULT_HOURS_PER_TIME, moneyPerTime: null }
            onChange({ timeBack: adjust === 'hours' ? { ...cur, hoursPerTime: v } : { ...cur, moneyPerTime: v } })
            setAdjust(null)
          }}
        />
      )}
    </section>
  )
}

const HOUR_STEPS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12]
function AdjustSheet({ kind, value, onSave, onClose }) {
  const swipe = useSwipeDown(onClose)
  const [hours, setHours] = useState(value ?? DEFAULT_HOURS_PER_TIME)
  const [money, setMoney] = useState(value == null ? '' : String(value))
  const m = Number(money)
  const moneyOk = money.trim() !== '' && Number.isFinite(m) && m > 0 && m <= 100000
  const i = Math.max(0, HOUR_STEPS.indexOf(hours))
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="adjust-title" data-testid="adjust-sheet"
        onClick={(e) => e.stopPropagation()} {...swipe}>
        <div className="sheet-handle" aria-hidden="true" />
        {kind === 'hours' ? (
          <>
            <h2 id="adjust-title">About how long each time?</h2>
            <p className="sheet-hint">A rough guess is fine. The default is 1 hour.</p>
            <div className="ob-step">
              <button type="button" className="ob-sb" aria-label="Less" disabled={i === 0} onClick={() => setHours(HOUR_STEPS[i - 1])}>−</button>
              <div><div className="ob-sv" data-testid="adjust-hours">{hours}</div><div className="ob-su">{hours === 1 ? 'hour' : 'hours'} each time</div></div>
              <button type="button" className="ob-sb" aria-label="More" disabled={i === HOUR_STEPS.length - 1} onClick={() => setHours(HOUR_STEPS[i + 1])}>+</button>
            </div>
            <div className="sheet-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={() => onSave(hours)}>Save</button>
            </div>
          </>
        ) : (
          <>
            <h2 id="adjust-title">Money estimate</h2>
            <p className="sheet-hint">Optional, and only on this phone. About how much did one time cost?</p>
            <label className="field">
              <span>Dollars per time</span>
              <input type="number" inputMode="decimal" min="0" step="any" value={money} placeholder="e.g. 40" onChange={(e) => setMoney(e.target.value)} />
            </label>
            <div className="sheet-actions">
              <button type="button" className="btn btn-secondary" onClick={() => (value == null ? onClose() : onSave(null))}>{value == null ? 'Cancel' : 'Turn off'}</button>
              <button type="button" className="btn btn-primary" disabled={!moneyOk} onClick={() => onSave(Math.round(m * 100) / 100)}>Save</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
