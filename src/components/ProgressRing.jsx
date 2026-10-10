// The live-walk ring. `value` goes from 0 to 1 (time walked so far).
// `open` = no end (open walk): a full ring that slowly breathes instead of filling up.
function ProgressRing({ value, size = 252, stroke = 16, open = false, paused = false, children }) {
  const c = size / 2
  const r = (size - stroke) / 2 - 6 // room for the glow
  const circumference = 2 * Math.PI * r
  const v = open ? 1 : Math.min(Math.max(value, 0), 1)
  const offset = circumference * (1 - v)
  return (
    <div className={`ring${open ? ' ring-open' : ''}${paused ? ' ring-paused' : ''}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id="walk-arc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--ring-b)' }} />
            <stop offset="1" style={{ stopColor: 'var(--ring-a)' }} />
          </linearGradient>
          <filter id="walk-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle className="ring-track" cx={c} cy={c} r={r} strokeWidth={stroke} fill="none" />
        <circle className="ring-inner" cx={c} cy={c} r={r - stroke / 2 - 16} fill="none" />
        {(open || v > 0) && (
          <circle
            className="ring-fill"
            cx={c}
            cy={c}
            r={r}
            strokeWidth={stroke}
            fill="none"
            stroke="url(#walk-arc)"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${c} ${c})`}
            filter="url(#walk-glow)"
          />
        )}
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  )
}

export default ProgressRing
