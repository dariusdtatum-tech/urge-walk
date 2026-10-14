// Quiet links to the hosted privacy policy, terms and support pages (opened outside the app).
const LEGAL_LINKS = [
  { label: 'Privacy policy', href: 'https://dariusdtatum-tech.github.io/urgewalk/privacy.html' },
  { label: 'Terms', href: 'https://dariusdtatum-tech.github.io/urgewalk/terms.html' },
  { label: 'Support', href: 'https://dariusdtatum-tech.github.io/urgewalk/support.html' },
]

function LegalLinks() {
  return (
    <nav className="you-legal" aria-label="About Urge Walk">
      {LEGAL_LINKS.map((l, i) => (
        <span key={l.href}>
          {i > 0 && <span className="you-legal-dot" aria-hidden="true">·</span>}
          <a href={l.href} target="_blank" rel="noopener noreferrer">{l.label}</a>
        </span>
      ))}
    </nav>
  )
}

export default LegalLinks
