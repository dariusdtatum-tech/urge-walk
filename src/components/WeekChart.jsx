import { chartPoints, smoothPath } from '../lib/homeStats.js'

const W = 320
const H = 74
const PAD_TOP = 10
const PAD_BOTTOM = 6

// "Urges walked" line for the chosen range. The current day/week is highlighted.
function WeekChart({ buckets, counts, caption, dots = true }) {
  // Half a column on each side, so each point sits right above its label.
  const padX = W / (2 * counts.length)
  const { max, points } = chartPoints(counts, { width: W, height: H, padX, padTop: PAD_TOP, padBottom: PAD_BOTTOM })
  const line = smoothPath(points)
  const baseY = H - PAD_BOTTOM
  const area = points.length > 1
    ? `${line} L${points[points.length - 1].x},${baseY} L${points[0].x},${baseY} Z`
    : ''
  const n = buckets.length
  const total = counts.reduce((a, b) => a + b, 0)

  return (
    <div className="chart-wrap" data-testid="walks-chart" data-points={n}>
      <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Urges walked, ${Math.round(total)} in this range`} data-max={max}>
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" className="chart-fill-a" />
            <stop offset="1" className="chart-fill-b" />
          </linearGradient>
        </defs>
        {area && <path d={area} fill="url(#chart-fill)" />}
        <path className="chart-line" d={line} fill="none" />
        {points.map((p, i) => (buckets[i].current ? (
          <g key={i} data-testid="chart-today">
            <circle className="chart-today-halo" cx={p.x} cy={p.y} r="6.5" />
            <circle className="chart-today-dot" cx={p.x} cy={p.y} r="2.6" />
          </g>
        ) : (
          dots && <circle key={i} className="chart-dot" cx={p.x} cy={p.y} r="2.4" />
        )))}
      </svg>
      <div className="chart-labels" style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
        {buckets.map((b, i) => {
          let cls = 'chart-label'
          if (n > 7 && i === 0) cls += ' first'
          if (n > 7 && i === n - 1) cls += ' last'
          if (n <= 7 && b.current) cls += ' today'
          return <span key={i} className={cls}>{b.showLabel ? b.label : ''}</span>
        })}
      </div>
      {caption && <p className="chart-caption">{caption}</p>}
    </div>
  )
}

export default WeekChart
