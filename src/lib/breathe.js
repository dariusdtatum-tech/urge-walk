// One breath: in for 4s, hold for 1s, out for 6s (about 5.5 breaths fill the minute).
export const BREATH = { inMs: 4000, holdMs: 1000, outMs: 6000 }
const CYCLE = BREATH.inMs + BREATH.holdMs + BREATH.outMs

// Where we are in the breath after `ms`: 'in' (growing, and holding full) or 'out' (shrinking).
export function breathPhase(ms) {
  const t = ((ms % CYCLE) + CYCLE) % CYCLE
  return t < BREATH.inMs + BREATH.holdMs ? 'in' : 'out'
}
