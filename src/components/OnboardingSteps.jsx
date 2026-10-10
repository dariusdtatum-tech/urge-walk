// The answer editors used by onboarding (one per screen) and by You -> Your answers.
import { useState } from 'react'
import { daysBetween, parseISODate, todayISO } from '../lib/cleanTime.js'
import {
  IDENTITY, IMPORTANCE, IMPROVE, MAX_IMPROVE, MAX_TRUSTED_NAME, MAX_WHY, RIDING_GROUPS, SUPPORT,
  communityAvailable, validatePhone,
} from '../lib/profile.js'

import { MAX_NAME_LENGTH } from '../lib/storage.js'

const Check = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5 10 17 19 7" /></svg>
)
const line = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }
const IDENTITY_ICONS = {
  healthy: <svg {...line}><path d="M12 3v18M5 10l7-7 7 7" /></svg>,
  daybyday: <svg {...line}><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></svg>,
  done: <svg {...line}><path d="M5 12.5 10 17 19 7" /></svg>,
  control: <svg {...line}><path d="M4 12h6l2-6 2 12 2-6h4" /></svg>,
  loved: <svg {...line}><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" /></svg>,
  waves: <svg {...line}><path d="M3 17c3 0 4-6 7-6s4 8 7 8 3-4 4-4" /></svg>,
}
// A radio option card. `children` = optional extra content (e.g. the trusted-contact fields).
function Option({ selected, disabled, onSelect, title, hint, icon, badge, testId }) {
  return (
    <button type="button" role="radio" aria-checked={selected} disabled={disabled} data-testid={testId}
      className={`ob-opt${selected ? ' sel' : ''}${icon ? ' ic' : ''}`} onClick={onSelect}>
      {icon && <span className="ob-li">{icon}</span>}
      <span className="ob-opt-text">
        <b>{title}{badge && <span className="ob-soon">{badge}</span>}</b>
        {hint && <span>{hint}</span>}
      </span>
      <span className={selected ? 'ob-ck' : 'ob-rad'} aria-hidden="true">{selected && <Check />}</span>
    </button>
  )
}

// ---------- 03 Riding out (multi-select, custom entries) ----------
export function RidingStep({ picks, onChange }) {
  const [query, setQuery] = useState('')
  const q = query.trim()
  const toggle = (name) => onChange(picks.includes(name) ? picks.filter((p) => p !== name) : [...picks, name])
  const known = RIDING_GROUPS.flatMap((g) => g.items)
  const custom = picks.filter((p) => !known.includes(p))
  const match = (name) => name.toLowerCase().includes(q.toLowerCase())
  const exact = [...known, ...picks].some((n) => n.toLowerCase() === q.toLowerCase())
  const groups = [
    ...(custom.length ? [{ id: 'own', label: 'Your own', items: custom }] : []),
    ...RIDING_GROUPS,
  ].map((g) => ({ ...g, items: g.items.filter(match) })).filter((g) => g.items.length)
  return (
    <>
      <label className="ob-search">
        <svg {...line} width="18" height="18"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
        <input type="search" value={query} maxLength={MAX_NAME_LENGTH} placeholder="Search or type your own"
          aria-label="Search or type your own" onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && q && !exact) { onChange([...picks, q]); setQuery('') } }} />
      </label>
      <div className="ob-scroll" role="group" aria-label="What are you riding out?">
        {q && !exact && (
          <button type="button" className="ob-add" onClick={() => { onChange([...picks, q]); setQuery('') }}>+ Add “{q}”</button>
        )}
        {groups.map((g) => (
          <section key={g.id}>
            <h2 className="ob-grp">{g.label}</h2>
            <div className="ob-list">
              {g.items.map((name) => {
                const on = picks.includes(name)
                return (
                  <button key={name} type="button" role="checkbox" aria-checked={on} className={on ? 'ob-it sel' : 'ob-it'} onClick={() => toggle(name)}>
                    <span>{name}</span>
                    {on && <span className="ob-ck" aria-hidden="true"><Check /></span>}
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}

// ---------- 04 Start date ----------
const MONTHS = Array.from({ length: 12 }, (_, i) => new Date(2000, i, 1).toLocaleDateString(undefined, { month: 'long' }))
export function DateStep({ value, onChange, today = todayISO() }) {
  const p = parseISODate(value) || parseISODate(today)
  const t = parseISODate(today)
  const years = Array.from({ length: 41 }, (_, i) => t.y - 40 + i)
  const dim = new Date(p.y, p.m, 0).getDate()
  function set(y, m, d) {
    const max = new Date(y, m, 0).getDate()
    let iso = `${y}-${String(m).padStart(2, '0')}-${String(Math.min(d, max)).padStart(2, '0')}`
    if (iso > today) iso = today // clean days can't start in the future
    onChange(iso)
  }
  const days = Math.max(0, daysBetween(value, today))
  return (
    <>
      <div className="ob-wheel">
        <select aria-label="Month" value={p.m} onChange={(e) => set(p.y, Number(e.target.value), p.d)}>
          {MONTHS.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
        </select>
        <select aria-label="Day" value={p.d} onChange={(e) => set(p.y, p.m, Number(e.target.value))}>
          {Array.from({ length: dim }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
        </select>
        <select aria-label="Year" value={p.y} onChange={(e) => set(Number(e.target.value), p.m, p.d)}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <p className="ob-days" data-testid="ob-days" aria-live="polite">That’s <b>{days.toLocaleString()} {days === 1 ? 'day' : 'days'}</b>.</p>
    </>
  )
}

// ---------- 05 / 06 Steppers with marks ----------
export function StepperStep({ value, onChange, min, max, unit, marks, testId }) {
  const shown = value ?? null
  return (
    <>
      <div className="ob-step">
        <button type="button" className="ob-sb" aria-label="Less" disabled={shown != null && shown <= min}
          onClick={() => onChange(shown == null ? min : Math.max(min, shown - 1))}>−</button>
        <div>
          <div className="ob-sv" data-testid={testId}>{shown == null ? '–' : (shown === max && marks.at(-1).endsWith('+') ? `${max}+` : shown)}</div>
          <div className="ob-su">{unit}</div>
        </div>
        <button type="button" className="ob-sb" aria-label="More" disabled={shown != null && shown >= max}
          onClick={() => onChange(shown == null ? Math.max(min, 1) : Math.min(max, shown + 1))}>+</button>
      </div>
      <div className="ob-marks" aria-hidden="true">
        {marks.map((m, i) => (
          <span key={i} className="ob-mark">
            <i className={shown != null && i < shown ? 'on' : ''} />
            <span>{m}</span>
          </span>
        ))}
      </div>
    </>
  )
}

// ---------- 07 Improve (up to 3) ----------
export function ImproveStep({ value, onChange }) {
  const toggle = (id) => {
    if (value.includes(id)) onChange(value.filter((v) => v !== id))
    else if (value.length < MAX_IMPROVE) onChange([...value, id])
  }
  return (
    <>
      <div className="ob-pills" role="group" aria-label="What do you want more of?">
        {IMPROVE.map((o) => {
          const on = value.includes(o.id)
          return (
            <button key={o.id} type="button" aria-pressed={on} className={on ? 'ob-pill on' : 'ob-pill'}
              disabled={!on && value.length >= MAX_IMPROVE} onClick={() => toggle(o.id)}>
              {on && <Check />}{o.label}
            </button>
          )
        })}
      </div>
      <p className="ob-cnt" data-testid="ob-improve-count">{value.length} of {MAX_IMPROVE} chosen</p>
    </>
  )
}

export function ImportanceStep({ value, onChange }) {
  return (
    <div className="ob-opts" role="radiogroup" aria-label="How important is this to you right now?">
      {IMPORTANCE.map((o) => (
        <Option key={o.id} selected={value === o.id} onSelect={() => onChange(o.id)} title={o.label} hint={o.hint} />
      ))}
    </div>
  )
}

export function IdentityStep({ value, onChange }) {
  return (
    <div className="ob-opts" role="radiogroup" aria-label="I see myself as someone who is">
      {IDENTITY.map((o) => (
        <Option key={o.id} selected={value === o.id} onSelect={() => onChange(o.id)} title={o.label} icon={IDENTITY_ICONS[o.id]} />
      ))}
    </div>
  )
}

// ---------- 10 Who's with you (+ trusted contact) ----------
export function SupportStep({ value, onChange }) {
  const { support, trustedName, trustedPhone } = value
  const [touched, setTouched] = useState(false)
  const set = (changes) => onChange({ ...value, ...changes })
  const phoneBad = trustedPhone.trim() !== '' && validatePhone(trustedPhone) == null
  return (
    <div className="ob-opts" role="radiogroup" aria-label="Who’s with you?">
      {SUPPORT.map((o) => {
        const soon = o.id === 'community' && !communityAvailable()
        return (
          <div key={o.id}>
            <Option selected={support === o.id} disabled={soon} onSelect={() => set({ support: o.id })}
              title={o.label} hint={o.hint} badge={soon ? 'Coming soon' : null} testId={`support-${o.id}`} />
            {o.id === 'trusted' && support === 'trusted' && (
              <div className="ob-trusted">
                <label className="field">
                  <span>Their name</span>
                  <input value={trustedName} maxLength={MAX_TRUSTED_NAME} autoComplete="off" placeholder="e.g. Sam"
                    onChange={(e) => set({ trustedName: e.target.value })} />
                </label>
                <label className="field">
                  <span>Their phone number</span>
                  <input type="tel" inputMode="tel" value={trustedPhone} maxLength={30} autoComplete="off"
                    placeholder="(555) 123-4567" aria-invalid={phoneBad && touched}
                    onBlur={() => setTouched(true)} onChange={(e) => set({ trustedPhone: e.target.value })} />
                </label>
                {phoneBad && touched && <p className="ob-error" role="alert">That doesn’t look like a phone number.</p>}
                <p className="ob-hint">Only on this phone. You’ll see “Text {trustedName.trim() || 'them'}” when you ride one out.</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function WhyStep({ value, onChange, autoFocus = true }) {
  return (
    <>
      <textarea className="ob-field" rows={3} maxLength={MAX_WHY} value={value} autoFocus={autoFocus}
        aria-label="Why does this matter to you?" placeholder="To be there for my kids…" onChange={(e) => onChange(e.target.value)} />
      <p className="ob-hint">
        <svg {...line} width="16" height="16"><path d="M3 15c3 0 4-6 7-6s4 8 7 8 3-4 4-4" /></svg>
        You’ll see this when an urge hits.
      </p>
    </>
  )
}
