// A circle that fills up as the walk goes on. `value` goes from 0 to 1.
// `open` = no end (open walk): a full ring that gently breathes instead of filling up.
function ProgressRing({ value, size = 260, stroke = 12, open = false, paused = false, children }) {
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - Math.min(Math.max(value, 0), 1))
  return (
    <div className={`ring${open ? ' ring-open' : ''}${paused ? ' ring-paused' : ''}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" />
        <circle
          className="ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  )
}

export default ProgressRing
