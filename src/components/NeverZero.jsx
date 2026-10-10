import { cleanCount, last30, lifetimeRidden } from '../lib/homeIdeas.js'

// Never zero: the lifetime count of urges ridden out (never resets) and the last 30 days as dots.
// Clean days are filled sea-glass dots; other days are a hollow outline. No red, no X.
function NeverZero({ hero, walks, today }) {
  const days = last30(hero, today)
  const clean = cleanCount(days)
  const total = lifetimeRidden(walks)
  return (
    <section className="card never-zero" data-testid="never-zero" aria-label="Never zero">
      <div className="nz-cols">
        <div>
          <p className="nz-k">Urges ridden out</p>
          <p className="nz-n" data-testid="nz-lifetime">{total.toLocaleString()}</p>
          <p className="nz-sub">lifetime · walks, breaths, logs</p>
        </div>
        <div>
          <p className="nz-k">Last 30 days</p>
          <p className="nz-n" data-testid="nz-clean"><span>{clean}</span><small> of 30</small></p>
          <p className="nz-sub">days clean</p>
        </div>
      </div>
      <ol className="nz-dots" aria-label={`${clean} of the last 30 days clean`}>
        {days.map((d) => (
          <li key={d.date} className={d.clean ? 'nz-dot on' : 'nz-dot'} title={d.date} data-date={d.date} />
        ))}
      </ol>
    </section>
  )
}

export default NeverZero
