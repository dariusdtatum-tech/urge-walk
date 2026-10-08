// A soft two-note chime for the end of a walk, using Web Audio.
// iOS only allows sound after a tap, so unlockAudio() is called when Start is tapped.
// Everything here fails silently: the chime is a nice extra, never required.
let ctx = null

export function unlockAudio() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    if (!ctx) ctx = new AudioCtx()
    if (ctx.state === 'suspended') ctx.resume()
    // Play one silent sample so iOS fully "unlocks" audio for later.
    const buffer = ctx.createBuffer(1, 1, 22050)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    source.start(0)
  } catch {
    // ignore
  }
}

function tone(freq, startAt, duration) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.0001, startAt)
  gain.gain.exponentialRampToValueAtTime(0.18, startAt + 0.04)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(startAt)
  osc.stop(startAt + duration + 0.05)
}

export function playChime() {
  try {
    if (navigator.vibrate) navigator.vibrate([120, 80, 120]) // Android only; iOS ignores it
    if (!ctx || ctx.state !== 'running') return
    const t = ctx.currentTime
    tone(660, t, 0.9)
    tone(880, t + 0.35, 1.2)
  } catch {
    // ignore
  }
}
