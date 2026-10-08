import { WALK_OPTIONS } from '../lib/walkTimer.js'

// The big urge button plus the 5 / 10 / 15 minute choice. One tap starts the walk.
function WalkStart({ minutes, onChangeMinutes, onStart }) {
  return (
    <section className="walk-start">
      <p className="walk-lead">Urges pass. Let’s walk while this one does.</p>

      <button className="urge-btn" onClick={onStart}>
        <span className="urge-btn-title">I have an urge</span>
        <span className="urge-btn-sub">Start a {minutes}-minute walk</span>
      </button>

      <div className="segmented" role="group" aria-label="Walk length">
        {WALK_OPTIONS.map((m) => (
          <button
            key={m}
            className={m === minutes ? 'segment active' : 'segment'}
            aria-pressed={m === minutes}
            onClick={() => onChangeMinutes(m)}
          >
            {m} min
          </button>
        ))}
      </div>
    </section>
  )
}

export default WalkStart
