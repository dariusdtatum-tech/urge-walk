import { useState } from 'react'
import './App.css'

// The four tabs in the bottom bar. Each one is just a placeholder for now.
const TABS = [
  { id: 'home', label: 'Home', icon: '🏠', blurb: 'Your clean-time tracker will live here.' },
  { id: 'walk', label: 'Walk', icon: '🚶', blurb: 'The urge button and 5 / 10 / 15-minute walk timer will live here.' },
  { id: 'log', label: 'Log', icon: '📋', blurb: 'Your urge log will live here.' },
  { id: 'journal', label: 'Journal', icon: '📓', blurb: 'Your private journal will live here.' },
]

function App() {
  // Which tab is showing right now
  const [activeTab, setActiveTab] = useState('home')
  const tab = TABS.find((t) => t.id === activeTab)

  return (
    <div className="app">
      <header className="header">
        <h1>Urge Walk</h1>
        <p className="subtitle">Skeleton is running.</p>
      </header>

      <main className="content">
        <section className="card">
          <div className="card-icon" aria-hidden="true">{tab.icon}</div>
          <h2>{tab.label}</h2>
          <p>{tab.blurb}</p>
          <p className="muted">Coming soon.</p>
        </section>
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
