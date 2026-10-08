// The Home ring: the hero tracker's clean days.
// The arc is "momentum" around the number, always drawn to the same length.
// It is deliberately NOT a goal or a quota (no "of 365"), so a clean day never looks unfinished.
export const HERO_ARC = 0.85

function HeroRing({ name, days, caption, size = 248, stroke = 18 }) {
  const c = size / 2
  const r = (size - stroke) / 2 - 6 // room for the glow
  const circumference = 2 * Math.PI * r
  const arc = circumference * HERO_ARC
  // End of the arc (for the glowing cap), measured clockwise from 12 o'clock.
  const angle = 2 * Math.PI * HERO_ARC - Math.PI / 2
  const capX = c + r * Math.cos(angle)
  const capY = c + r * Math.sin(angle)
  const digits = days.toLocaleString()
  let numberClass = 'hero-number'
  if (digits.length > 5) numberClass += ' hero-number-xs'
  else if (digits.length > 3) numberClass += ' hero-number-sm'

  return (
    <div className="hero-ring" style={{ width: size, height: size }} data-testid="hero-ring">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <defs>
          <linearGradient id="hero-arc" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#25b9da" />
            <stop offset="0.55" stopColor="#3de4ff" />
            <stop offset="1" stopColor="#8ff3ff" />
          </linearGradient>
          <filter id="hero-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <circle className="hero-track" cx={c} cy={c} r={r} strokeWidth={stroke} fill="none" />
        <circle className="hero-inner" cx={c} cy={c} r={r - stroke / 2 - 16} />
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
          filter="url(#hero-glow)"
          style={{ '--arc': arc, '--circ': circumference }}
        />
        <circle className="hero-cap" cx={capX} cy={capY} r={stroke / 2 - 1} filter="url(#hero-glow)" />
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
