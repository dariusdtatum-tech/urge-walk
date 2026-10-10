import { CUSTOM_MAX, CUSTOM_MIN, WALK_OPTIONS, clampCustomMinutes } from '../lib/walkTimer.js'

const CUSTOM_VALUES = Array.from({ length: CUSTOM_MAX - CUSTOM_MIN + 1 }, (_, i) => CUSTOM_MIN + i)

// 5 · 10 · 15 · Custom (1–120) · Open. The choice is remembered and used by "Walk" in Ride it out.
function WalkLengthPicker({ prefs, onChangePrefs }) {
  const { choice, customMinutes } = prefs
  const set = (changes) => onChangePrefs({ ...prefs, ...changes })
  const chips = [
    ...WALK_OPTIONS.map((m) => ({ id: m, main: String(m), sub: 'min', label: `${m} minutes` })),
    { id: 'custom', main: 'Custom', sub: `${customMinutes} min`, label: 'Custom length' },
    { id: 'open', main: 'Open', sub: 'no timer', label: 'Open walk' },
  ]
  return (
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
          <button className="stepper" aria-label="One minute less" disabled={customMinutes <= CUSTOM_MIN}
            onClick={() => set({ customMinutes: clampCustomMinutes(customMinutes - 1) })}>−</button>
          {/* A native select shows the iOS scroll-wheel picker */}
          <select className="custom-select" aria-label="Custom length in minutes" value={customMinutes}
            onChange={(e) => set({ customMinutes: clampCustomMinutes(e.target.value) })}>
            {CUSTOM_VALUES.map((v) => <option key={v} value={v}>{v} min</option>)}
          </select>
          <button className="stepper" aria-label="One minute more" disabled={customMinutes >= CUSTOM_MAX}
            onClick={() => set({ customMinutes: clampCustomMinutes(customMinutes + 1) })}>+</button>
        </div>
      )}
      {choice === 'open' && <p className="choice-hint">No timer. Walk as long as you like, then tap Finish walk.</p>}
    </div>
  )
}

export default WalkLengthPicker
