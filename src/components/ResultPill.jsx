// Small calm label for a walk's result.
const RESULT_INFO = {
  yes: { label: 'Passed', icon: '✓' },
  kinda: { label: 'Kinda', icon: '~' },
  no: { label: 'Didn’t pass', icon: '•' },
  skipped: { label: 'No check-in', icon: '–' },
}

function ResultPill({ result }) {
  const key = result || 'skipped'
  const info = RESULT_INFO[key]
  return (
    <span className={`pill pill-${key}`}>
      <span aria-hidden="true">{info.icon}</span> {info.label}
    </span>
  )
}

export default ResultPill
