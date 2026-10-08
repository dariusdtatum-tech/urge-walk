import { useEffect, useState } from 'react'
import './App.css'
import HomeTab from './components/HomeTab.jsx'
import WalkTab from './components/WalkTab.jsx'

// The four tabs in the bottom bar. Home and Walk are real; the others are placeholders for now.
const TABS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'walk', label: 'Walk', icon: '🚶' },
  { id: 'log', label: 'Log', icon: '📋', blurb: 'Your urge log will live here.' },
  { id: 'journal', label: 'Journal', icon: '📓', blurb: 'Your private journal will live here.' },
]

function Placeholder({ tab }) {
  return (
    <section className="card">
      <div className="card-icon" aria-hidden="true">{tab.icon}</div>
      <h2>{tab.label}</h2>
      <p>{tab.blurb}</p>
      <p className="muted">Coming soon.</p>
    </section>
  )
}

function App() {
  // Which tab is showing right now
  const [activeTab, setActiveTab] = useState('home')
  // A short message shown at the top after saving a walk
  const [toast, setToast] = useState('')
  const tab = TABS.find((t) => t.id === activeTab)

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(''), 5000)
    return () => clearTimeout(timer)
  }, [toast])

  function handleWalkSaved(message) {
    setToast(message)
    setActiveTab('home')
  }

  let view
  if (activeTab === 'home') view = <HomeTab onUrge={() => setActiveTab('walk')} />
  else if (activeTab === 'walk') view = <WalkTab onSaved={handleWalkSaved} />
  else view = <Placeholder tab={tab} />

  return (
    <div className="app">
      <header className="header">
        <h1>Urge Walk</h1>
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
            onClick={() => setActiveTab(t.id)}
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
