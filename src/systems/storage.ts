// Profile storage — port of js/storage.js:1 with bug fix.
// Legacy bug js/storage.js:104: `if(!Array.isArray(d.ownedWeapons))` always true
// because ownedWeapons is an object map, wiping unlocks. Fixed via zod schema.
import { z } from 'zod'
import type { OwnedWeapons, ProfileData } from '../game/types'
import { defaultOwnedWeapons } from '../game/types'

const OwnedWeaponsSchema = z.record(z.string(), z.boolean()).transform((o): OwnedWeapons => {
  const out: OwnedWeapons = { ...defaultOwnedWeapons() }
  for (const [k, v] of Object.entries(o)) {
    const n = Number(k)
    if (Number.isInteger(n) && n >= 0 && n <= 7 && typeof v === 'boolean') out[n] = v
  }
  return out
})

const ProfileSchema = z.object({
  career: z.object({
    credits: z.number().int().nonnegative().catch(0),
    upg: z.object({
      health: z.number().int().nonnegative().catch(0),
      cash: z.number().int().nonnegative().catch(0),
      grenades: z.number().int().nonnegative().catch(0),
      rifle: z.number().int().nonnegative().catch(0),
    }).catch({ health: 0, cash: 0, grenades: 0, rifle: 0 }),
  }),
  settings: z.object({
    sensitivity: z.number().min(0.3).max(2.5).catch(1),
    volume: z.number().min(0).max(1).catch(0.6),
    gfx: z.enum(['low', 'medium', 'high']).catch('medium'),
  }),
  best: z.object({ score: z.number().int().nonnegative().catch(0), wave: z.number().int().nonnegative().catch(0) }),
  ownedWeapons: OwnedWeaponsSchema,
  leaderboard: z.array(z.number()).catch([]),
})

export function blankData(): ProfileData {
  return {
    career: { credits: 0, upg: { health: 0, cash: 0, grenades: 0, rifle: 0 } },
    settings: { sensitivity: 1, volume: 0.6, gfx: 'medium' },
    best: { score: 0, wave: 0 },
    ownedWeapons: defaultOwnedWeapons(),
    leaderboard: [],
  }
}

export function sanitizeProfile(input: unknown): ProfileData {
  const parsed = ProfileSchema.safeParse(input)
  if (!parsed.success) {
    // Merge partial valid fields over blank instead of full wipe
    const b = blankData()
    if (input && typeof input === 'object') {
      const d = input as Record<string, unknown>
      // ownedWeapons object-shape compat: accept even though legacy check was Array-based
      if (d.ownedWeapons && typeof d.ownedWeapons === 'object' && !Array.isArray(d.ownedWeapons)) {
        const ow = OwnedWeaponsSchema.safeParse(d.ownedWeapons)
        if (ow.success) b.ownedWeapons = ow.data
      }
    }
    return { ...b }
  }
  return parsed.data as ProfileData
}

const PROFILES_KEY = 'voxelProfiles'
const dataKey = (name: string) => 'voxelProfile_' + name

export function getProfiles(): string[] {
  try {
    const l = JSON.parse(localStorage.getItem(PROFILES_KEY) || 'null')
    return Array.isArray(l) && l.length ? l.filter((x): x is string => typeof x === 'string') : []
  } catch { return [] }
}

export function loadProfileData(name: string): ProfileData {
  try {
    return sanitizeProfile(JSON.parse(localStorage.getItem(dataKey(name)) || 'null'))
  } catch { return blankData() }
}

export function saveProfileData(name: string, data: ProfileData): void {
  try { localStorage.setItem(dataKey(name), JSON.stringify(data)) } catch { /* quota */ }
}
