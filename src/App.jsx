import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import BackupScreen from './components/BackupScreen.jsx'
import BreatheScreen from './components/BreatheScreen.jsx'
import HomeTab from './components/HomeTab.jsx'
import { HomeIcon, JournalIcon, LogIcon, WaveIcon, YouIcon } from './components/Icons.jsx'
import JournalTab from './components/JournalTab.jsx'
import LogTab from './components/LogTab.jsx'
import PageHeader from './components/PageHeader.jsx'
import RideSheet from './components/RideSheet.jsx'
import WalkTab from './components/WalkTab.jsx'
import Waves from './components/Waves.jsx'
import YouTab from './components/YouTab.jsx'
import { BREATHE_SAVED_MESSAGES, LOGGED_SAVED_MESSAGE } from './lib/walkMessages.js'
import { startWalkNow } from './lib/walkStart.js'
import { appendWalk, buildBreatheRecord, buildLoggedRecord, lengthLabel, loadActiveWalk, loadWalkPrefs } from './lib/walkStorage.js'

// Two tabs, the center "Ride it out" button, two tabs.
const LEFT_TABS = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'log', label: 'Log', Icon: LogIcon },
]
const RIGHT_TABS = [
  { id: 'journal', label: 'Journal', Icon: JournalIcon },
  { id: 'you', label: 'You', Icon: YouIcon },
]
const LONG_PRESS_MS = 550

// A walk that's still going (not yet at the check-in screen).
function liveWalkSaved() {
  const w = loadActiveWalk()
  return w != null && w.endedAt == null
}

function App() {
  // Views: the four tabs, plus 'walk' and 'breathe' (full screen, reached from Ride it out).
  // If a walk was going when the app was closed, reopen straight into it.
  const [activeTab, setActiveTab] = useState(() => (liveWalkSaved() ? 'walk' : 'home'))
  // Focus mode: while a walk is live, the header and tab bar are hidden.
  const [focus, setFocus] = useState(() => liveWalkSaved())
  // A short message shown after saving
  const [toast, setToast] = useState('')
  // When a walk note is tapped in the Journal, the Log opens with that walk
  const [focusWalkId, setFocusWalkId] = useState(null)
  // The Backup screen opens from Home or You; the tab bar stays the same
  const [showBackup, setShowBackup] = useState(false)
  const [showRide, setShowRide] = useState(false)
  const contentRef = useRef(null)
  const press = useRef({ timer: null, fired: false })

  function goTo(tabId) {
    setFocusWalkId(null)
    setShowBackup(false)
    setActiveTab(tabId)
    contentRef.current?.scrollTo?.(0, 0)
  }

  // Walk: starts immediately (remembered length) into the distraction-free live walk.
  function handleWalk() {
    startWalkNow()
    setToast('') // the live walk stays free of distractions
    setShowRide(false)
    setFocus(true)
    goTo('walk')
  }

  function handleBreathe() {
    setToast('')
    setShowRide(false)
    goTo('breathe')
  }

  function handleLog(note) {
    appendWalk(buildLoggedRecord({ at: Date.now(), note }))
    setShowRide(false)
    setToast(LOGGED_SAVED_MESSAGE)
    goTo(activeTab === 'walk' || activeTab === 'breathe' ? 'home' : activeTab)
  }

  // Center button: tap opens Ride it out; a long press starts a walk right away.
  function pressStart() {
    clearTimeout(press.current.timer)
    press.current.fired = false
    press.current.timer = setTimeout(() => {
      press.current.fired = true
      navigator.vibrate?.(15)
      handleWalk()
    }, LONG_PRESS_MS)
  }
  function pressEnd() {
    clearTimeout(press.current.timer)
  }
  function handleCenterClick() {
    if (press.current.fired) {
      press.current.fired = false
      return
    }
    navigator.vibrate?.(8)
    if (liveWalkSaved()) { setFocus(true); goTo('walk'); return }
    setShowRide(true)
  }

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(''), 5000)
    return () => clearTimeout(timer)
  }, [toast])

  function handleWalkSaved(message) {
    setToast(message)
    goTo('home')
  }

  function handleBreatheSaved({ startedAt, endedAt, result, note }) {
    appendWalk(buildBreatheRecord({ startedAt, endedAt, result, note }))
    setToast(BREATHE_SAVED_MESSAGES[result || 'skip'])
    goTo('home')
  }

  const exitWalk = useCallback(() => { setFocus(false); setActiveTab('home') }, [])

  let view
  if (showBackup) {
    view = <BackupScreen onBack={() => setShowBackup(false)} backLabel={activeTab === 'you' ? 'You' : 'Home'} />
  } else if (activeTab === 'home') {
    view = <HomeTab onUrge={() => { setFocus(true); goTo('walk') }} onOpenBackup={() => setShowBackup(true)} />
  } else if (activeTab === 'walk') {
    view = <WalkTab onSaved={handleWalkSaved} onFocusChange={setFocus} onExit={exitWalk} />
  } else if (activeTab === 'breathe') {
    view = <BreatheScreen onSave={handleBreatheSaved} onCancel={() => goTo('home')} />
  } else if (activeTab === 'you') {
    view = <YouTab onOpenBackup={() => setShowBackup(true)} />
  } else if (activeTab === 'log') {
    view = (
      <>
        <PageHeader title="Log" />
        <LogTab onGoToWalk={() => setShowRide(true)} initialSelectedId={focusWalkId} />
      </>
    )
  } else {
    view = (
      <>
        <PageHeader title="Journal" />
        <JournalTab onOpenWalk={(id) => { setFocusWalkId(id); setActiveTab('log') }} />
      </>
    )
  }

  const inFocus = ((focus && activeTab === 'walk') || activeTab === 'breathe') && !showBackup
  const tabButton = ({ id, label, Icon }) => (
    <button
      key={id}
      className={id === activeTab && !showBackup ? 'tab active' : 'tab'}
      onClick={() => goTo(id)}
      aria-current={id === activeTab && !showBackup ? 'page' : undefined}
    >
      <Icon />
      <span className="tab-label">{label}</span>
    </button>
  )

  return (
    <div className={inFocus ? 'app app-focus' : 'app'}>
      <Waves />
      {toast && !inFocus && (
        <div className="toast" data-testid="toast" role="status" onClick={() => setToast('')}>
          {toast}
        </div>
      )}

      <main className="content" ref={contentRef}>
        {view}
      </main>

      {!inFocus && (
        <nav className="tabbar" aria-label="Main">
          <div className="tabbar-tabs">
            {LEFT_TABS.map(tabButton)}
            <div className="tab-center-slot">
              <button
                className="tab-ride"
                aria-label="Ride it out"
                data-testid="ride-button"
                onClick={handleCenterClick}
                onPointerDown={pressStart}
                onPointerUp={pressEnd}
                onPointerLeave={pressEnd}
                onPointerCancel={pressEnd}
                onContextMenu={(e) => e.preventDefault()}
              >
                <span className="tab-ride-circle"><WaveIcon /></span>
                <span className="tab-ride-label" aria-hidden="true">Ride it out</span>
              </button>
            </div>
            {RIGHT_TABS.map(tabButton)}
          </div>
        </nav>
      )}

      {showRide && (
        <RideSheet
          walkLabel={lengthLabel(loadWalkPrefs())}
          onWalk={handleWalk}
          onBreathe={handleBreathe}
          onLog={handleLog}
          onClose={() => setShowRide(false)}
        />
      )}
    </div>
  )
}

export default App
