// Pure timer math for the urge walk. No React and no ticking counters:
// everything is worked out from saved timestamps (milliseconds since 1970),
// so the time stays right even if iOS freezes the app or the screen locks.
//
// An "active walk" looks like:
// {
//   id, plannedMinutes,
//   startedAt,     // when Start was tapped
//   pausedAt,      // when Pause was tapped, or null while walking
//   pausedMs,      // total time spent paused before the current pause
//   endedAt,       // null while the walk is going; set when it finishes or ends early
//   endedEarly,    // true if "End early" was used
//   messageOffset, // which encouraging line to start with
// }

export const WALK_OPTIONS = [5, 10, 15]
export const DEFAULT_MINUTES = 10
export const MESSAGE_EVERY_MS = 2 * 60 * 1000

export function startWalk(plannedMinutes, now, { id, messageOffset = 0 } = {}) {
  return {
    id,
    plannedMinutes,
    startedAt: now,
    pausedAt: null,
    pausedMs: 0,
    endedAt: null,
    endedEarly: false,
    messageOffset,
  }
}

export function plannedMs(walk) {
  return walk.plannedMinutes * 60 * 1000
}

// Time actually spent walking (pauses don't count), between 0 and the planned length.
export function elapsedMs(walk, now) {
  const end = walk.endedAt ?? walk.pausedAt ?? now
  const ms = end - walk.startedAt - walk.pausedMs
  return Math.min(Math.max(ms, 0), plannedMs(walk))
}

export function remainingMs(walk, now) {
  return plannedMs(walk) - elapsedMs(walk, now)
}

// 0 at the start, 1 when done.
export function progress(walk, now) {
  return elapsedMs(walk, now) / plannedMs(walk)
}

export function isPaused(walk) {
  return walk.pausedAt != null && walk.endedAt == null
}

export function isEnded(walk) {
  return walk.endedAt != null
}

// True once the full time has been walked (and the walk hasn't been closed out yet).
export function isTimeUp(walk, now) {
  return !isEnded(walk) && !isPaused(walk) && remainingMs(walk, now) <= 0
}

export function pauseWalk(walk, now) {
  if (isEnded(walk) || isPaused(walk)) return walk
  return { ...walk, pausedAt: now }
}

export function resumeWalk(walk, now) {
  if (isEnded(walk) || !isPaused(walk)) return walk
  return { ...walk, pausedAt: null, pausedMs: walk.pausedMs + Math.max(now - walk.pausedAt, 0) }
}

// Close out the walk. For a walk that ran its full time, endedAt is the exact moment
// the timer hit zero (even if the app was closed and opened much later).
export function finishWalk(walk, now, { early = false } = {}) {
  if (isEnded(walk)) return walk
  const running = resumeWalk(walk, now) // fold any current pause into pausedMs
  if (!early || remainingMs(running, now) <= 0) {
    const naturalEnd = running.startedAt + running.pausedMs + plannedMs(running)
    return { ...running, endedAt: Math.min(naturalEnd, now), endedEarly: false }
  }
  return { ...running, endedAt: now, endedEarly: true }
}

// The record saved for the Log. Times are ISO strings so they're easy to read later.
export function buildWalkRecord(walk, { result = null, note = '' } = {}) {
  return {
    id: walk.id,
    startedAt: new Date(walk.startedAt).toISOString(),
    endedAt: new Date(walk.endedAt).toISOString(),
    plannedMinutes: walk.plannedMinutes,
    actualSeconds: Math.round(elapsedMs(walk, walk.endedAt) / 1000),
    endedEarly: Boolean(walk.endedEarly),
    result,
    note: note.trim(),
  }
}

// 599_001 ms -> "10:00", 0 -> "0:00". Rounds up so the clock never shows 0:00 early.
export function formatClock(ms) {
  const totalSeconds = Math.max(Math.ceil(ms / 1000), 0)
  const m = Math.floor(totalSeconds / 60)
  const s = String(totalSeconds % 60).padStart(2, '0')
  return `${m}:${s}`
}

// Which encouraging line to show: changes every 2 minutes of walking.
export function messageIndex(walk, now, count) {
  return (walk.messageOffset + Math.floor(elapsedMs(walk, now) / MESSAGE_EVERY_MS)) % count
}
