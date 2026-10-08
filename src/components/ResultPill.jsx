import { OUTCOME_LABELS, outcomeKey } from '../lib/logStats.js'

// A walk's outcome as a calm color word (mint / amber / grey). No red, no chunky pill.
function ResultPill({ result }) {
  const key = outcomeKey(result)
  return <span className={`outcome-word outcome-${key}`} data-testid="outcome-word">{OUTCOME_LABELS[key]}</span>
}

// The matching ring mark shown on the left of a Log entry.
export function OutcomeMark({ result }) {
  return <span className={`outcome-mark outcome-${outcomeKey(result)}`} aria-hidden="true" />
}

export default ResultPill
