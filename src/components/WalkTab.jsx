import { useEffect, useState } from 'react'
import { playChime, unlockAudio } from '../lib/chime.js'
import { makeId } from '../lib/storage.js'
import { useWakeLock } from '../lib/useWakeLock.js'
import { SAVED_MESSAGES, WALK_MESSAGES } from '../lib/walkMessages.js'
import {
  appendWalk, loadActiveWalk, loadWalkPrefs, plannedMinutesFor, saveActiveWalk, saveWalkPrefs,
} from '../lib/walkStorage.js'
import {
  buildWalkRecord, finishWalk, isEnded, isPaused, isTimeUp, pauseWalk, resumeWalk, startWalk,
} from '../lib/walkTimer.js'
import WalkActive from './WalkActive.jsx'
import WalkFinish from './WalkFinish.jsx'
import WalkStart from './WalkStart.jsx'

// Walk tab: start screen -> walk in progress -> finish screen.
// The walk in progress is saved to the phone on every change, so closing the app
// or locking the screen never loses it; the time is worked out from timestamps.
function WalkTab({ onSaved }) {
  const [walk, setWalk] = useState(() => loadActiveWalk())
  const [prefs, setPrefs] = useState(() => loadWalkPrefs()) // { choice, customMinutes }
  const [now, setNow] = useState(() => Date.now())

  const walking = walk != null && !isEnded(walk) && !isPaused(walk)
  useWakeLock(walking)

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

  function handleChangePrefs(next) {
    setPrefs(next)
    saveWalkPrefs(next)
  }

  function handleStart() {
    unlockAudio() // must happen during the tap for iOS to allow the chime later
    const t = Date.now()
    setNow(t)
    commit(startWalk(plannedMinutesFor(prefs), t, {
      id: makeId(),
      messageOffset: Math.floor(Math.random() * WALK_MESSAGES.length),
    }))
  }

  function handleSave({ result, note }, skipped = false) {
    appendWalk(buildWalkRecord(walk, skipped ? {} : { result, note }))
    commit(null)
    onSaved(SAVED_MESSAGES[skipped || !result ? 'skip' : result])
  }

  if (!walk) {
    return <WalkStart prefs={prefs} onChangePrefs={handleChangePrefs} onStart={handleStart} />
  }
  if (isEnded(walk)) {
    return <WalkFinish walk={walk} onSave={handleSave} onSkip={() => handleSave({}, true)} />
  }
  return (
    <WalkActive
      walk={walk}
      now={now}
      onPause={() => commit(pauseWalk(walk, Date.now()))}
      onResume={() => { unlockAudio(); const t = Date.now(); setNow(t); commit(resumeWalk(walk, t)) }}
      onEndEarly={() => commit(finishWalk(walk, Date.now(), { early: true }))}
      onFinish={() => { commit(finishWalk(walk, Date.now())); playChime() }}
    />
  )
}

export default WalkTab
