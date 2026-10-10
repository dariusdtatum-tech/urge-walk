import { useEffect, useRef, useState } from 'react'
import { CUSTOM_MAX, CUSTOM_MIN, WALK_OPTIONS, clampCustomMinutes } from '../lib/walkTimer.js'
import { ChevronDown } from './Icons.jsx'

const CUSTOM_VALUES = Array.from({ length: CUSTOM_MAX - CUSTOM_MIN + 1 }, (_, i) => CUSTOM_MIN + i)

// One huge button: tap it and the walk starts right away at the remembered length.
// The length choice (5 · 10 · 15 · Custom · Open) stays out of the way behind "Change length".
function WalkStart({ prefs, onChangePrefs, onStart, plusCount = 0 }) {
  const { choice, customMinutes } = prefs
  const set = (changes) => onChangePrefs({ ...prefs, ...changes })
  const [showLengths, setShowLengths] = useState(false)
  const urgeRef = useRef(null)

  // The + in the tab bar brings this screen up: put the urge button in focus (never press it).
  useEffect(() => {
    if (plusCount > 0) urgeRef.current?.focus({ preventScroll: true })
  }, [plusCount])

  let startLabel
  if (choice === 'open') startLabel = 'Start an open walk'
  else startLabel = `Start a ${choice === 'custom' ? customMinutes : choice}-minute walk`

  const chips = [
    ...WALK_OPTIONS.map((m) => ({ id: m, main: String(m), sub: 'min', label: `${m} minutes` })),
    { id: 'custom', main: 'Custom', sub: `${customMinutes} min`, label: 'Custom length' },
    { id: 'open', main: 'Open', sub: 'no timer', label: 'Open walk' },
  ]

  return (
    <section className="walk-start">
      <p className="walk-lead"><span>Urges pass, like waves.</span> <span>Let’s walk while this one does.</span></p>

      <div className="urge-halo">
        <button className="urge-btn" ref={urgeRef} onClick={onStart}>
          <span className="urge-btn-title"><span>I have</span> <span>an urge</span></span>
          <span className="urge-btn-sub">{startLabel}</span>
        </button>
      </div>

      <button
        className={showLengths ? 'change-length open' : 'change-length'}
        aria-expanded={showLengths}
        aria-controls="walk-options"
        onClick={() => setShowLengths(!showLengths)}
      >
        Change length <ChevronDown />
      </button>

      {showLengths && (
        <div className="walk-options" id="walk-options">
          <div className="segmented segmented-chips" role="group" aria-label="Walk length">
            {chips.map((c) => (
              <button
                key={c.id}
                className={c.id === choice ? 'segment chip active' : 'segment chip'}
                aria-pressed={c.id === choice}
                aria-label={c.label}
                onClick={() => set({ choice: c.id })}
              >
                <span className="chip-main">{c.main}</span>
                <span className="chip-sub">{c.sub}</span>
              </button>
            ))}
          </div>

          {choice === 'custom' && (
            <div className="custom-picker">
              <button
                className="stepper"
                aria-label="One minute less"
                disabled={customMinutes <= CUSTOM_MIN}
                onClick={() => set({ customMinutes: clampCustomMinutes(customMinutes - 1) })}
              >−</button>
              {/* A native select shows the iOS scroll-wheel picker */}
              <select
                className="custom-select"
                aria-label="Custom length in minutes"
                value={customMinutes}
                onChange={(e) => set({ customMinutes: clampCustomMinutes(e.target.value) })}
              >
                {CUSTOM_VALUES.map((v) => <option key={v} value={v}>{v} min</option>)}
              </select>
              <button
                className="stepper"
                aria-label="One minute more"
                disabled={customMinutes >= CUSTOM_MAX}
                onClick={() => set({ customMinutes: clampCustomMinutes(customMinutes + 1) })}
              >+</button>
            </div>
          )}
          {choice === 'open' && (
            <p className="choice-hint">No timer. Walk as long as you like, then tap Finish walk.</p>
          )}
        </div>
      )}
    </section>
  )
}

export default WalkStart
