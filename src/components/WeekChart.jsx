import { chartPoints, smoothPath } from '../lib/homeStats.js'

const W = 320
const H = 104
const PAD_TOP = 14
const PAD_BOTTOM = 10

// "Urges walked" line chart for the chosen range. Today (or the current hours) is highlighted.
function WeekChart({ title, buckets, counts }) {
  // Half a column on each side, so each point sits right above its label.
  const padX = W / (2 * counts.length)
  const { max, points } = chartPoints(counts, { width: W, height: H, padX, padTop: PAD_TOP, padBottom: PAD_BOTTOM })
  const line = smoothPath(points)
  const baseY = H - PAD_BOTTOM
  const area = points.length > 1
    ? `${line} L${points[points.length - 1].x},${baseY} L${points[0].x},${baseY} Z`
    : ''
  const midY = PAD_TOP + (H - PAD_TOP - PAD_BOTTOM) / 2
  const many = points.length > 10
  const total = counts.reduce((a, b) => a + b, 0)

  return (
    <section className="chart-card" aria-label={`${title}: ${total} ${total === 1 ? 'urge' : 'urges'} walked`}>
      <div className="chart-head">
        <h2>{title}</h2>
        <span>Urges walked</span>
      </div>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-hidden="true" data-max={max}>
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3de4ff" stopOpacity="0.28" />
            <stop offset="1" stopColor="#3de4ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line className="chart-mid" x1={padX} x2={W - padX} y1={midY} y2={midY} />
        {area && <path d={area} fill="url(#chart-fill)" />}
        <path className="chart-line" d={line} fill="none" />
        {points.map((p, i) => (buckets[i].current ? (
          <g key={i} data-testid="chart-today">
            <circle className="chart-today-halo" cx={p.x} cy={p.y} r="7.5" />
            <circle className="chart-today-dot" cx={p.x} cy={p.y} r="3.2" />
          </g>
        ) : (
          !many && <circle key={i} className="chart-dot" cx={p.x} cy={p.y} r="2.6" />
        )))}
      </svg>
      <div className="chart-labels" style={{ gridTemplateColumns: `repeat(${buckets.length}, 1fr)` }}>
        {buckets.map((b, i) => (
          <span key={i} className={b.current ? 'chart-label current' : 'chart-label'}>
            {b.showLabel || b.current ? b.label : ''}
          </span>
        ))}
      </div>
    </section>
  )
}

export default WeekChart
