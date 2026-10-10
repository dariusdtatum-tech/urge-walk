import { useEffect, useRef, useState } from 'react'
import './App.css'
import BackupScreen from './components/BackupScreen.jsx'
import HomeTab from './components/HomeTab.jsx'
import { HomeIcon, JournalIcon, LogIcon, PlusIcon, WalkIcon } from './components/Icons.jsx'
import JournalTab from './components/JournalTab.jsx'
import LogTab from './components/LogTab.jsx'
import PageHeader from './components/PageHeader.jsx'
import WalkTab from './components/WalkTab.jsx'
import Waves from './components/Waves.jsx'
import { loadActiveWalk } from './lib/walkStorage.js'

// The four tabs in the floating bar.
const TABS = [
  { id: 'home', label: 'Home', Icon: HomeIcon },
  { id: 'walk', label: 'Walk', Icon: WalkIcon },
  { id: 'log', label: 'Log', Icon: LogIcon },
  { id: 'journal', label: 'Journal', Icon: JournalIcon },
]

// A walk that's still going (not yet at the check-in screen).
function liveWalkSaved() {
  const w = loadActiveWalk()
  return w != null && w.endedAt == null
}

function App() {
  // If a walk was going when the app was closed, reopen straight into it.
  const [activeTab, setActiveTab] = useState(() => (liveWalkSaved() ? 'walk' : 'home'))
  // Focus mode: while a walk is live, the header and tab bar are hidden.
  const [focus, setFocus] = useState(() => liveWalkSaved())
  // A short message shown at the top after saving a walk
  const [toast, setToast] = useState('')
  // When a walk note is tapped in the Journal, the Log opens with that walk
  const [focusWalkId, setFocusWalkId] = useState(null)
  // The Backup screen opens from Home (Edit sheet or reminder); the tab bar stays the same
  const [showBackup, setShowBackup] = useState(false)
  // Bumped by the + button so the Walk screen can bring the urge button into view
  const [plusCount, setPlusCount] = useState(0)
  const contentRef = useRef(null)

  function goTo(tabId) {
    setFocusWalkId(null)
    setShowBackup(false)
    setActiveTab(tabId)
    contentRef.current?.scrollTo?.(0, 0)
  }

  // + opens the Walk start screen. It never starts the timer: the big urge button does.
  function handlePlus() {
    goTo('walk')
    setPlusCount((n) => n + 1)
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

  let view
  if (showBackup) {
    view = <BackupScreen onBack={() => setShowBackup(false)} />
  } else if (activeTab === 'home') {
    view = <HomeTab onUrge={() => goTo('walk')} onOpenBackup={() => setShowBackup(true)} />
  } else if (activeTab === 'walk') {
    view = <WalkTab onSaved={handleWalkSaved} onFocusChange={setFocus} plusCount={plusCount} />
  } else if (activeTab === 'log') {
    view = (
      <>
        <PageHeader title="Log" />
        <LogTab onGoToWalk={() => goTo('walk')} initialSelectedId={focusWalkId} />
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

  const inFocus = focus && activeTab === 'walk' && !showBackup

  return (
    <div className={inFocus ? 'app app-focus' : 'app'}>
      <Waves />
      {toast && (
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
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                className={id === activeTab ? 'tab active' : 'tab'}
                onClick={() => goTo(id)}
                aria-current={id === activeTab ? 'page' : undefined}
              >
                <Icon />
                <span className="tab-label">{label}</span>
              </button>
            ))}
          </div>
          <button className="tab-plus" aria-label="New urge walk" onClick={handlePlus}>
            <PlusIcon />
          </button>
        </nav>
      )}
    </div>
  )
}

export default App
