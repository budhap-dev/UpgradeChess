/** Tiny WebAudio sound effects — no assets. Respects the `sounds` setting via `setSoundEnabled`. */
let ctx: AudioContext | null = null
let enabled = true
let hapticsOn = true
export function setSoundEnabled(v: boolean) { enabled = v }
export function setHapticsEnabled(v: boolean) { hapticsOn = v }

function ac(): AudioContext | null {
  if (!enabled) return null
  try { ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)(); if (ctx.state === 'suspended') void ctx.resume(); return ctx } catch { return null }
}
function tone(freq: number, ms: number, type: OscillatorType = 'sine', gain = 0.08, when = 0) {
  const a = ac(); if (!a) return
  const o = a.createOscillator(); const g = a.createGain()
  o.type = type; o.frequency.value = freq
  g.gain.setValueAtTime(0.0001, a.currentTime + when); g.gain.exponentialRampToValueAtTime(gain, a.currentTime + when + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + when + ms / 1000)
  o.connect(g); g.connect(a.destination); o.start(a.currentTime + when); o.stop(a.currentTime + when + ms / 1000 + 0.02)
}
export const sfx = {
  move: () => tone(520, 45, 'triangle', 0.06),
  capture: () => { tone(300, 70, 'square', 0.05); tone(180, 90, 'triangle', 0.05, 0.02) },
  check: () => tone(760, 80, 'sine', 0.06),
  success: () => { tone(660, 90, 'sine', 0.07); tone(880, 120, 'sine', 0.07, 0.09); tone(1320, 160, 'sine', 0.05, 0.18) },
  fail: () => { tone(220, 120, 'sawtooth', 0.05); tone(160, 180, 'sawtooth', 0.05, 0.1) },
  tick: () => tone(1000, 25, 'sine', 0.03),
}
export function haptic(pattern: number | number[]) { if (hapticsOn && 'vibrate' in navigator) { try { navigator.vibrate(pattern) } catch { /* ignore */ } } }
