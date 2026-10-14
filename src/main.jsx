import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { requestPersistentStorage } from './lib/persist.js'
import { applyTheme, loadTheme } from './lib/theme.js'

// Appearance override (System / Light / Dark) before the first paint.
applyTheme(loadTheme())

// Ask the browser to keep this app's data even when the phone is low on space.
requestPersistentStorage()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
