// Dark-techno lookahead scheduler — port of js/music.js:11 (128 BPM, 16 steps).
import { audio } from './audio'

const BPM = 128
const STEP = 60 / BPM / 4
const BASS = [110.0, 130.81, 146.83, 164.81, 98.0]
const BASS_PAT = [0, 0, 2, 0, 3, 0, 2, 0, 0, 0, 2, 0, 3, 4, 2, 0]
const LEAD = [440.0, 523.25, 587.33, 659.25, 783.99, 880.0]
const LEAD_PAT = [0, 2, 1, 3, 2, 4, 3, 5, 3, 2, 4, 3, 1, 3, 2, 0]

class MusicEngine {
  timer: ReturnType<typeof setInterval> | null = null
  step = 0
  nextTime = 0
  intensity = 0.2
  running = false

  start(): void {
    if (this.running) return
    audio.init()
    if (!audio.ctx || !audio.master) return
    this.running = true
    this.step = 0
    this.nextTime = audio.ctx.currentTime + 0.12
    this.timer = setInterval(() => this.scheduler(), 30)
  }
  stop(): void {
    this.running = false
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }
  setIntensity(v: number): void {
    this.intensity = Math.max(0, Math.min(1, v))
  }
  private scheduler(): void {
    if (!audio.ctx || !this.running) return
    while (this.nextTime < audio.ctx.currentTime + 0.14) {
      this.scheduleStep(this.step, this.nextTime)
      this.nextTime += STEP
      this.step = (this.step + 1) % 16
    }
  }
  private tone(t: number, freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number): void {
    if (!audio.ctx || !audio.master) return
    const o = audio.ctx.createOscillator(), g = audio.ctx.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, t)
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur)
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g); g.connect(audio.master)
    o.start(t); o.stop(t + dur)
  }
  private noise(t: number, dur: number, vol: number, filterType: BiquadFilterType, freq: number): void {
    if (!audio.ctx || !audio.master) return
    const len = Math.floor(audio.ctx.sampleRate * dur)
    const buf = audio.ctx.createBuffer(1, len, audio.ctx.sampleRate)
    const d = buf.getChannelData(0)
    for (let k = 0; k < len; k++) d[k] = (Math.random() * 2 - 1) * (1 - k / len)
    const src = audio.ctx.createBufferSource()
    src.buffer = buf
    const f = audio.ctx.createBiquadFilter()
    f.type = filterType
    f.frequency.value = freq
    const g = audio.ctx.createGain()
    g.gain.value = vol
    src.connect(f); f.connect(g); g.connect(audio.master)
    src.start(t)
  }
  private scheduleStep(step: number, t: number): void {
    const i = this.intensity
    const beat = step % 4
    if (beat === 0 && i > 0.3) {
      if (!audio.ctx || !audio.master) return
      const o = audio.ctx.createOscillator(), g = audio.ctx.createGain()
      o.type = 'sine'
      o.frequency.setValueAtTime(150, t)
      o.frequency.exponentialRampToValueAtTime(42, t + 0.11)
      g.gain.setValueAtTime(0.5 * i, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22)
      o.connect(g); g.connect(audio.master)
      o.start(t); o.stop(t + 0.24)
    }
    if (step % 8 === 4 && i > 0.45) {
      this.noise(t, 0.12, 0.3 * i, 'bandpass', 2000)
      this.tone(t, 220, 0.06, 'triangle', 0.12 * i, 130)
    }
    if (step % 2 === 1 && i > 0.55) this.noise(t, 0.04, 0.16 * i, 'highpass', 7000)
    if (beat === 0) this.tone(t, BASS[BASS_PAT[step]], 0.22, 'sawtooth', (i > 0.6 ? 1 : 0.55) * 0.12)
    else if (beat === 2 && i > 0.4) this.tone(t, BASS[BASS_PAT[step]], 0.18, 'sawtooth', 0.05)
    if (i > 0.55 && step % 2 === 0) this.tone(t, LEAD[LEAD_PAT[step]], 0.16, 'square', 0.03 * i)
    if (beat === 0 && i > 0.25) this.tone(t, BASS[BASS_PAT[step]] / 2, 0.5, 'triangle', 0.05 * i)
  }
}

export const music = new MusicEngine()
