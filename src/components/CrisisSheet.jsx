import { useSwipeDown } from '../lib/useSwipeDown.js'

// US crisis lines (public numbers). Each row is a plain tel:/sms: link so the phone does the rest.
const RESOURCES = [
  {
    id: '988', name: '988 Suicide & Crisis Lifeline', note: 'Free, 24/7. Call or text 988.',
    links: [{ label: 'Call 988', href: 'tel:988' }, { label: 'Text 988', href: 'sms:988' }],
  },
  {
    id: 'samhsa', name: 'SAMHSA National Helpline', note: 'Free, confidential, 24/7. Treatment referral and information.',
    links: [{ label: 'Call 1-800-662-4357', href: 'tel:18006624357' }],
  },
  {
    id: '911', name: 'Emergency', note: 'If you or someone else is in immediate danger.',
    links: [{ label: 'Call 911', href: 'tel:911' }],
  },
]

function CrisisSheet({ onClose }) {
  const swipe = useSwipeDown(onClose)
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet crisis-sheet" role="dialog" aria-modal="true" aria-labelledby="crisis-title"
        data-testid="crisis-sheet" onClick={(e) => e.stopPropagation()} {...swipe}>
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-title-row">
          <h2 id="crisis-title">Crisis resources</h2>
          <button className="icon-btn" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <p className="crisis-lead">If you’re struggling, you don’t have to ride it out alone. Reach out now.</p>
        <ul className="crisis-list">
          {RESOURCES.map((r) => (
            <li key={r.id} className="crisis-item" data-testid={`crisis-${r.id}`}>
              <span className="crisis-name">{r.name}</span>
              <span className="crisis-note">{r.note}</span>
              <span className="crisis-links">
                {r.links.map((l) => <a key={l.href} className="btn btn-secondary crisis-link" href={l.href}>{l.label}</a>)}
              </span>
            </li>
          ))}
        </ul>
        <p className="crisis-disclaimer" data-testid="crisis-disclaimer">
          Urge Walk is a habit tool, not treatment or a substitute for professional care.
        </p>
      </div>
    </div>
  )
}

export default CrisisSheet
