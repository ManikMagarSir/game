import { create } from 'zustand'

export interface Tracer { id: number; ax: number; ay: number; az: number; bx: number; by: number; bz: number; life: number }
export interface Particle { id: number; x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; color: string }
export interface Caption { id: number; text: string; t: number }

let nextId = 1
interface FxState {
  tracers: Tracer[]
  particles: Particle[]
  hitmarker: number
  hitmarkerHead: boolean
  banner: string
  bannerT: number
  dmgT: number
  dmgAngle: number
  captions: Caption[]
  addTracer: (a: [number, number, number], b: [number, number, number]) => void
  burst: (x: number, y: number, z: number, color: string, n: number) => void
  pingHit: (head: boolean) => void
  pingKill: () => void
  pingDamage: (angle: number) => void
  caption: (text: string) => void
  showBanner: (t: string) => void
  tick: (dt: number) => void
  clear: () => void
}

export const useFxStore = create<FxState>((set) => ({
  tracers: [],
  particles: [],
  hitmarker: 0,
  hitmarkerHead: false,
  banner: '',
  bannerT: 0,
  dmgT: 0,
  dmgAngle: 0,
  captions: [],
  addTracer: (a, b) =>
    set((s) => ({
      tracers: [...s.tracers.slice(-31), { id: nextId++, ax: a[0], ay: a[1], az: a[2], bx: b[0], by: b[1], bz: b[2], life: 0.06 }],
    })),
  burst: (x, y, z, color, n) =>
    set((s) => {
      const add: Particle[] = []
      for (let i = 0; i < n; i++) {
        add.push({
          id: nextId++,
          x, y, z,
          vx: (Math.random() - 0.5) * 5,
          vy: Math.random() * 5 + 1,
          vz: (Math.random() - 0.5) * 5,
          life: 0.5 + Math.random() * 0.3,
          color,
        })
      }
      return { particles: [...s.particles.slice(-120), ...add] }
    }),
  pingHit: (head) => set({ hitmarker: 0.12, hitmarkerHead: head }),
  pingKill: () => set({ hitmarker: 0.18, hitmarkerHead: true }),
  pingDamage: (angle) => set({ dmgT: 0.7, dmgAngle: angle }),
  caption: (text) =>
    set((s) => {
      if (s.captions.length && s.captions[s.captions.length - 1].text === text) return {}
      return { captions: [...s.captions.slice(-2), { id: nextId++, text, t: 2.5 }] }
    }),
  showBanner: (t) => set({ banner: t, bannerT: 2.2 }),
  tick: (dt) =>
    set((s) => ({
      tracers: s.tracers.map((t) => ({ ...t, life: t.life - dt })).filter((t) => t.life > 0),
      particles: s.particles
        .map((p) => ({ ...p, life: p.life - dt, x: p.x + p.vx * dt, y: p.y + p.vy * dt, z: p.z + p.vz * dt, vy: p.vy - 9 * dt }))
        .filter((p) => p.life > 0 && p.y > 0),
      hitmarker: Math.max(0, s.hitmarker - dt),
      bannerT: Math.max(0, s.bannerT - dt),
      dmgT: Math.max(0, s.dmgT - dt),
      captions: s.captions
        .map((c) => ({ ...c, t: c.t - dt }))
        .filter((c) => c.t > 0),
    })),
  clear: () => set({ tracers: [], particles: [], hitmarker: 0, banner: '', bannerT: 0, captions: [], dmgT: 0 }),
}))
