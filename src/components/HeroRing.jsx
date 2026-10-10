// The Home ring: the hero tracker's clean days.
// The arc shows progress through the current milestone segment only (e.g. 90 → 180 days).
// On a milestone day it's full, and `celebrate` adds one slow cyan glow (none with reduced motion).
function HeroRing({ name, days, caption, progress, celebrate = false, size = 206, stroke = 12 }) {
  const c = size / 2
  const r = (size - stroke) / 2 - 6 // room for the glow
  const circumference = 2 * Math.PI * r
  const p = Math.min(Math.max(progress, 0), 1)
  const arc = circumference * p
  const digits = days.toLocaleString()
  let numberClass = 'hero-number'
  if (digits.length > 5) numberClass += ' hero-number-xs'
  else if (digits.length > 3) numberClass += ' hero-number-sm'

  return (
    <div
      className={celebrate ? 'hero-ring hero-celebrate' : 'hero-ring'}
      style={{ width: size, height: size }}
      data-testid="hero-ring"
      data-progress={p.toFixed(3)}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id="hero-arc" x1="1" y1="0" x2="0" y2="1">
            {/* Theme colours (sea glass), see --ring-a / --ring-b in index.css */}
            <stop offset="0" style={{ stopColor: 'var(--ring-b)' }} />
            <stop offset="1" style={{ stopColor: 'var(--ring-a)' }} />
          </linearGradient>
        </defs>
        <circle className="hero-track" cx={c} cy={c} r={r} strokeWidth={stroke} fill="none" />
        {p > 0 && (
          <circle
              className="hero-arc"
              cx={c}
              cy={c}
              r={r}
              strokeWidth={stroke}
              fill="none"
              stroke="url(#hero-arc)"
              strokeLinecap="round"
              strokeDasharray={`${arc} ${circumference}`}
              transform={`rotate(-90 ${c} ${c})`}
            />
        )}
      </svg>
      <div className="hero-center">
        <span className="hero-name" data-testid="hero-name">{name}</span>
        <span className={numberClass} data-testid="days">{digits}</span>
        <span className="hero-unit">{days === 1 ? 'day clean' : 'days clean'}</span>
        <span className="hero-since" data-testid="hero-since">{caption}</span>
      </div>
    </div>
  )
}

export default HeroRing
