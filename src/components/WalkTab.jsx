import { useEffect, useState } from 'react'
import { playChime, unlockAudio } from '../lib/chime.js'
import { useWakeLock } from '../lib/useWakeLock.js'
import { SAVED_MESSAGES } from '../lib/walkMessages.js'
import { appendWalk, loadActiveWalk, saveActiveWalk } from '../lib/walkStorage.js'
import {
  buildWalkRecord, extendWalk, finishWalk, isEnded, isOpen, isPaused, isTimeUp, pauseWalk, resumeWalk,
} from '../lib/walkTimer.js'
import PageHeader from './PageHeader.jsx'
import WalkActive from './WalkActive.jsx'
import WalkFinish from './WalkFinish.jsx'

// The walk screen (not a tab any more): walk in progress -> finish screen.
// The walk in progress is saved to the phone on every change, so closing the app
// or locking the screen never loses it; the time is worked out from timestamps.
function WalkTab({ onSaved, onFocusChange = () => {}, onExit = () => {} }) {
  const [walk, setWalk] = useState(() => loadActiveWalk())
  const [now, setNow] = useState(() => Date.now())

  const walking = walk != null && !isEnded(walk) && !isPaused(walk)
  useWakeLock(walking)

  // Focus mode (no header or tab bar) for as long as the walk is live, paused included.
  const live = walk != null && !isEnded(walk)
  useEffect(() => {
    onFocusChange(live)
  }, [live, onFocusChange])
  useEffect(() => () => onFocusChange(false), [onFocusChange])

  // Save every change right away (synchronously), then update the screen.
  function commit(next) {
    saveActiveWalk(next)
    setWalk(next)
  }

  // Refresh the clock a few times a second while walking, and whenever the app
  // comes back to the foreground (iOS pauses timers in the background).
  useEffect(() => {
    if (!walking) return undefined
    const tick = () => setNow(Date.now())
    const timer = setInterval(tick, 250)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [walking])

  // When the time is up, close out the walk and play the chime.
  useEffect(() => {
    if (walk && isTimeUp(walk, now)) {
      const done = finishWalk(walk, now)
      saveActiveWalk(done)
      // Reacting to the clock (an outside system) is exactly what this effect is for.
      // eslint-disable-next-line react/set-state-in-effect
      setWalk(done)
      playChime()
    }
  }, [walk, now])

  function handleSave({ result, note }, skipped = false) {
    appendWalk(buildWalkRecord(walk, skipped ? {} : { result, note }))
    commit(null)
    onSaved(SAVED_MESSAGES[skipped || !result ? 'skip' : result])
  }

  // Nothing to show (no walk saved): back to where we came from.
  useEffect(() => {
    if (!walk) onExit()
  }, [walk, onExit])
  if (!walk) return null
  if (isEnded(walk)) {
    return (
      <>
        <PageHeader title="Walk" />
        <WalkFinish walk={walk} onSave={handleSave} onSkip={() => handleSave({}, true)} />
      </>
    )
  }
  return (
    <WalkActive
      walk={walk}
      now={now}
      onPause={() => commit(pauseWalk(walk, Date.now()))}
      onResume={() => { unlockAudio(); const t = Date.now(); setNow(t); commit(resumeWalk(walk, t)) }}
      onExtend={() => commit(extendWalk(walk))}
      onFinish={() => {
        // Timed walk finished before its time = ended early (no chime); open walks always chime.
        commit(finishWalk(walk, Date.now(), { early: true }))
        if (isOpen(walk)) playChime()
      }}
    />
  )
}

export default WalkTab
