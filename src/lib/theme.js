// Appearance: follow the phone (System) or force Light / Dark. Stored on this phone only.
// index.css reads <html data-theme>: 'light' / 'dark' override, absent = follow the system.
export const THEME_KEY = 'urgewalk.v1.theme'
export const THEMES = [
  { id: 'system', label: 'System' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
]
const BAR = { light: '#faf7f1', dark: '#0f1d33' }

export function loadTheme(storage = globalThis.localStorage) {
  try {
    const v = storage?.getItem(THEME_KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

export function applyTheme(theme, doc = globalThis.document) {
  if (!doc) return
  const root = doc.documentElement
  if (theme === 'light' || theme === 'dark') root.dataset.theme = theme
  else delete root.dataset.theme
  // Status bar color: an override pins both meta tags to that theme; System restores each one.
  for (const m of doc.querySelectorAll('meta[name="theme-color"]')) {
    const own = (m.getAttribute('media') || '').includes('dark') ? 'dark' : 'light'
    m.setAttribute('content', BAR[theme === 'system' ? own : theme])
  }
}

export function saveTheme(theme, storage = globalThis.localStorage, doc = globalThis.document) {
  const t = theme === 'light' || theme === 'dark' ? theme : 'system'
  try {
    if (t === 'system') storage.removeItem(THEME_KEY)
    else storage.setItem(THEME_KEY, t)
  } catch {
    // storage full or blocked: still apply for this session
  }
  applyTheme(t, doc)
  return t
}
