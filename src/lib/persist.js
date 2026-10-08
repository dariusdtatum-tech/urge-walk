// Ask the browser to treat this app's saved data as "persistent", so it isn't cleared
// when the device runs low on space. iOS decides on its own (no prompt) and is more
// likely to say yes for apps opened from the Home Screen. Failing is harmless.
export async function requestPersistentStorage() {
  try {
    if (!navigator.storage || !navigator.storage.persist) return false
    if (navigator.storage.persisted && (await navigator.storage.persisted())) return true
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

// True on iPhone/iPad (iPadOS reports itself as a Mac with a touch screen).
export function isIOS() {
  const ua = navigator.userAgent || ''
  return /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
}

// True when opened from the Home Screen icon (not a Safari tab).
export function isStandalone() {
  return Boolean(
    navigator.standalone ||
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches),
  )
}
