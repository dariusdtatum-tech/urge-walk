import { useEffect, useState } from 'react'
import './App.css'
import BackupScreen from './components/BackupScreen.jsx'
import HomeTab from './components/HomeTab.jsx'
import JournalTab from './components/JournalTab.jsx'
import LogTab from './components/LogTab.jsx'
import WalkTab from './components/WalkTab.jsx'

// The four tabs in the bottom bar.
const TABS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'walk', label: 'Walk', icon: '🚶' },
  { id: 'log', label: 'Log', icon: '📋' },
  { id: 'journal', label: 'Journal', icon: '📓' },
]

function App() {
  // Which tab is showing right now
  const [activeTab, setActiveTab] = useState('home')
  // A short message shown at the top after saving a walk
  const [toast, setToast] = useState('')
  // When a walk note is tapped in the Journal, the Log opens with that walk
  const [focusWalkId, setFocusWalkId] = useState(null)
  // The Backup screen opens from Home (gear button or reminder); the tab bar stays the same
  const [showBackup, setShowBackup] = useState(false)

  function goTo(tabId) {
    setFocusWalkId(null)
    setShowBackup(false)
    setActiveTab(tabId)
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
  if (showBackup) view = <BackupScreen onBack={() => setShowBackup(false)} />
  else if (activeTab === 'home') view = <HomeTab onUrge={() => goTo('walk')} onOpenBackup={() => setShowBackup(true)} />
  else if (activeTab === 'walk') view = <WalkTab onSaved={handleWalkSaved} />
  else if (activeTab === 'log') view = <LogTab onGoToWalk={() => goTo('walk')} initialSelectedId={focusWalkId} />
  else view = <JournalTab onOpenWalk={(id) => { setFocusWalkId(id); setActiveTab('log') }} />

  return (
    <div className="app">
      <header className="header">
        <h1>Urge Walk</h1>
        {activeTab === 'home' && !showBackup && (
          <button className="header-btn" aria-label="Backup" onClick={() => setShowBackup(true)}>
            <span aria-hidden="true">⚙︎</span>
          </button>
        )}
        <p className="subtitle">One day at a time.</p>
      </header>

      <main className="content">
        {toast && (
          <div className="toast" data-testid="toast" role="status" onClick={() => setToast('')}>
            {toast}
          </div>
        )}
        {view}
      </main>

      <nav className="tabbar" aria-label="Main">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={t.id === activeTab ? 'tab active' : 'tab'}
            onClick={() => goTo(t.id)}
            aria-current={t.id === activeTab ? 'page' : undefined}
          >
            <span className="tab-icon" aria-hidden="true">{t.icon}</span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App
