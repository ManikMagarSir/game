// Procedural WebAudio SFX — port of js/audio.js:18. Zero assets.
class AudioEngine {
  ctx: AudioContext | null = null
  master: GainNode | null = null
  ready = false

  init(): void {
    if (this.ctx) return
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new AC()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.6
      this.master.connect(this.ctx.destination)
      this.ready = true
    } catch { this.ready = false }
  }
  resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume()
  }
  setVolume(v: number): void {
    if (this.master) this.master.gain.value = v
  }
  tone(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.05, slideTo: number | null = null): void {
    if (!this.ready || !this.ctx || !this.master) return
    const t = this.ctx.currentTime
    const o = this.ctx.createOscillator(), g = this.ctx.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, t)
    if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur)
    g.gain.setValueAtTime(vol, t)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g); g.connect(this.master)
    o.start(t); o.stop(t + dur)
  }
  noise(dur: number, vol = 0.05, filterFreq = 900): void {
    if (!this.ready || !this.ctx || !this.master) return
    const len = Math.floor(this.ctx.sampleRate * dur)
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
    const src = this.ctx.createBufferSource()
    src.buffer = buf
    const f = this.ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = filterFreq
    const g = this.ctx.createGain()
    g.gain.value = vol
    src.connect(f); f.connect(g); g.connect(this.master)
    src.start()
  }
  shoot(kind: string): void {
    if (!this.ready) return
    switch (kind) {
      case 'pistol': this.tone(680, 0.06, 'square', 0.05, 220); this.noise(0.05, 0.04, 1400); break
      case 'smg': this.tone(520, 0.04, 'square', 0.04, 180); this.noise(0.035, 0.03, 1600); break
      case 'shotgun': this.tone(180, 0.18, 'sawtooth', 0.07, 70); this.noise(0.18, 0.07, 800); break
      case 'rifle': this.tone(820, 0.07, 'square', 0.06, 260); this.noise(0.06, 0.045, 1800); break
      case 'flamer': this.noise(0.05, 0.03, 700); this.tone(220, 0.05, 'sawtooth', 0.02, 140); break
      default: this.tone(600, 0.05, 'square', 0.05, 200)
    }
  }
  hit(): void { this.tone(900, 0.03, 'square', 0.025) }
  headshot(): void { this.tone(1500, 0.05, 'square', 0.04, 2200) }
  zombieDie(): void { this.tone(160, 0.2, 'sawtooth', 0.05, 60); this.noise(0.2, 0.05, 500) }
  explosion(): void { this.tone(90, 0.4, 'sawtooth', 0.09, 35); this.noise(0.4, 0.1, 600) }
  pickup(): void { this.tone(660, 0.1, 'sine', 0.05); this.tone(990, 0.12, 'sine', 0.04) }
  levelup(): void { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.tone(f, 0.18, 'triangle', 0.05), i * 90)) }
  wave(): void { this.tone(330, 0.25, 'sawtooth', 0.05, 440) }
  hurt(): void { this.tone(140, 0.15, 'square', 0.05, 80); this.noise(0.1, 0.03, 400) }
  melee(): void { this.tone(180, 0.12, 'square', 0.05) }
}

export const audio = new AudioEngine()
