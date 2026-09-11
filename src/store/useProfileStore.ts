import { create } from 'zustand'
import type { Career } from '../game/types'
import type { GfxTier } from '../game/types'
import { sanitizeBinds, type Binds } from '../lib/binds'
import { sanitizeColorblind, type ColorblindMode } from '../lib/colorblind'

// Named profiles — port of js/storage.js:29 profiles + legacy migration.
// Owns the persisted bundle; game/settings stores hold the runtime copies.
export interface ProfileBundle {
  career: Career
  settings: { sensitivity: number; volume: number; gfx: GfxTier; fov: number; invertY: boolean; muted: boolean; binds: Binds; colorblind: ColorblindMode }
  best: { score: number; wave: number }
}

const LIST_KEY = 'voxel-r3f-profiles'
const ACTIVE_KEY = 'voxel-r3f-active'
const dataKey = (name: string) => `voxel-r3f-profile_${name}`

function blankBundle(): ProfileBundle {
  return {
    career: { credits: 0, upg: { health: 0, cash: 0, grenades: 0, rifle: 0 } },
    settings: { sensitivity: 1, volume: 0.6, gfx: 'medium', fov: 75, invertY: false, muted: false, binds: sanitizeBinds(null), colorblind: 'off' },
    best: { score: 0, wave: 0 },
  }
}

function num(v: unknown): number {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
}

function sanitizeBundle(input: unknown): ProfileBundle {
  const b = blankBundle()
  if (!input || typeof input !== 'object') return b
  const d = input as Record<string, unknown>
  try {
    const c = (d.career ?? {}) as Record<string, unknown>
    const u = (c.upg ?? {}) as Record<string, unknown>
    b.career = {
      credits: num(c.credits),
      upg: { health: num(u.health), cash: num(u.cash), grenades: num(u.grenades), rifle: num(u.rifle) },
    }
    const s = (d.settings ?? {}) as Record<string, unknown>
    const sens = Number(s.sensitivity)
    const vol = Number(s.volume)
    const fov = Number(s.fov)
    b.settings = {
      sensitivity: Number.isFinite(sens) ? Math.min(2.5, Math.max(0.3, sens)) : 1,
      volume: Number.isFinite(vol) ? Math.min(1, Math.max(0, vol)) : 0.6,
      gfx: s.gfx === 'low' || s.gfx === 'high' ? s.gfx : 'medium',
      fov: Number.isFinite(fov) ? Math.min(110, Math.max(60, fov)) : 75,
      invertY: s.invertY === true,
      muted: s.muted === true,
      binds: sanitizeBinds(s.binds),
      colorblind: sanitizeColorblind(s.colorblind),
    }
    const best = (d.best ?? {}) as Record<string, unknown>
    b.best = { score: num(best.score), wave: num(best.wave) }
  } catch { /* keep blanks */ }
  return b
}

function readJSON(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null')
  } catch {
    return null
  }
}

// One-time migration: legacy vanilla keys + flat Phase-3 keys → SURVIVOR bundle.
function migrate(): { profiles: string[]; active: string } {
  // Legacy vanilla profiles (js/storage.js:1)
  try {
    const legacyList = readJSON('voxelProfiles')
    if (Array.isArray(legacyList) && legacyList.length) {
      const names = legacyList.filter((x): x is string => typeof x === 'string').map((n) => n.toUpperCase().slice(0, 16))
      for (const n of names) {
        const d = readJSON(`voxelProfile_${n}`)
        if (d) localStorage.setItem(dataKey(n), JSON.stringify(sanitizeBundle(d)))
      }
      const active = String(localStorage.getItem('voxelActiveProfile') || names[0] || 'SURVIVOR')
      localStorage.setItem(LIST_KEY, JSON.stringify(names))
      localStorage.setItem(ACTIVE_KEY, names.includes(active) ? active : names[0])
      return { profiles: names, active: names.includes(active) ? active : names[0] }
    }
  } catch { /* fall through */ }
  // Flat Phase-3 keys → single SURVIVOR profile
  const flat = blankBundle()
  try {
    const career = readJSON('voxel-r3f-career') as { credits?: unknown; upg?: unknown } | null
    if (career) {
      flat.career.credits = num(career.credits)
      const u = (career.upg ?? {}) as Record<string, unknown>
      flat.career.upg = { health: num(u.health), cash: num(u.cash), grenades: num(u.grenades), rifle: num(u.rifle) }
    }
    const settings = readJSON('voxel-r3f-settings') as { state?: Record<string, unknown> } | null
    const st = settings?.state ?? settings ?? {}
    if (st && typeof st === 'object') {
      const sens = Number((st as Record<string, unknown>).sensitivity)
      const vol = Number((st as Record<string, unknown>).volume)
      if (Number.isFinite(sens)) flat.settings.sensitivity = sens
      if (Number.isFinite(vol)) flat.settings.volume = vol
      const gfx = (st as Record<string, unknown>).gfx
      if (gfx === 'low' || gfx === 'high') flat.settings.gfx = gfx
      const fov = Number((st as Record<string, unknown>).fov)
      if (Number.isFinite(fov)) flat.settings.fov = Math.min(110, Math.max(60, fov))
      if ((st as Record<string, unknown>).invertY === true) flat.settings.invertY = true
      if ((st as Record<string, unknown>).muted === true) flat.settings.muted = true
      flat.settings.binds = sanitizeBinds((st as Record<string, unknown>).binds)
      flat.settings.colorblind = sanitizeColorblind((st as Record<string, unknown>).colorblind)
    }
    const best = readJSON('voxel-r3f-best') as Record<string, unknown> | null
    if (best) flat.best = { score: num(best.score), wave: num(best.wave) }
  } catch { /* fresh */ }
  localStorage.setItem(dataKey('SURVIVOR'), JSON.stringify(flat))
  localStorage.setItem(LIST_KEY, JSON.stringify(['SURVIVOR']))
  localStorage.setItem(ACTIVE_KEY, 'SURVIVOR')
  return { profiles: ['SURVIVOR'], active: 'SURVIVOR' }
}

interface ProfileState {
  profiles: string[]
  active: string
  bundle: ProfileBundle
  ensure: () => void
  create: (name: string) => void
  remove: (name: string) => void
  switchTo: (name: string) => void
  patch: (p: Partial<ProfileBundle>) => void
}

function loadBundle(name: string): ProfileBundle {
  return sanitizeBundle(readJSON(dataKey(name)))
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profiles: [],
  active: '',
  bundle: blankBundle(),
  ensure: () => {
    let profiles: string[] = []
    let active = ''
    try {
      const l = readJSON(LIST_KEY)
      profiles = Array.isArray(l) ? l.filter((x): x is string => typeof x === 'string') : []
      active = String(localStorage.getItem(ACTIVE_KEY) || '')
    } catch { /* migrate */ }
    if (!profiles.length) {
      const m = migrate()
      profiles = m.profiles
      active = m.active
    }
    if (!profiles.includes(active)) active = profiles[0]
    try { localStorage.setItem(ACTIVE_KEY, active) } catch { /* noop */ }
    set({ profiles, active, bundle: loadBundle(active) })
  },
  create: (name) => {
    const clean = (name || '').trim().toUpperCase().slice(0, 16)
    if (!clean) return
    const { profiles } = get()
    if (!profiles.includes(clean)) {
      try { localStorage.setItem(dataKey(clean), JSON.stringify(blankBundle())) } catch { /* noop */ }
      const next = [...profiles, clean]
      try { localStorage.setItem(LIST_KEY, JSON.stringify(next)) } catch { /* noop */ }
      set({ profiles: next })
    }
    get().switchTo(clean)
  },
  remove: (name) => {
    let { profiles, active } = get()
    profiles = profiles.filter((p) => p !== name)
    try { localStorage.removeItem(dataKey(name)) } catch { /* noop */ }
    if (!profiles.length) {
      profiles = ['SURVIVOR']
      try { localStorage.setItem(dataKey('SURVIVOR'), JSON.stringify(blankBundle())) } catch { /* noop */ }
    }
    try { localStorage.setItem(LIST_KEY, JSON.stringify(profiles)) } catch { /* noop */ }
    if (active === name || !profiles.includes(active)) active = profiles[0]
    try { localStorage.setItem(ACTIVE_KEY, active) } catch { /* noop */ }
    set({ profiles, active, bundle: loadBundle(active) })
  },
  switchTo: (name) => {
    if (!get().profiles.includes(name)) return
    try { localStorage.setItem(ACTIVE_KEY, name) } catch { /* noop */ }
    set({ active: name, bundle: loadBundle(name) })
  },
  patch: (p) => {
    const { active, bundle } = get()
    const next = { ...bundle, ...p }
    try { localStorage.setItem(dataKey(active), JSON.stringify(next)) } catch { /* noop */ }
    set({ bundle: next })
  },
}))
