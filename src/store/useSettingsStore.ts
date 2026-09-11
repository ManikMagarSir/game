import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GfxTier } from '../game/types'
import { DEFAULT_BINDS, type Binds } from '../lib/binds'
import { sanitizeColorblind, type ColorblindMode } from '../lib/colorblind'

export interface SettingsShape {
  sensitivity: number
  volume: number
  gfx: GfxTier
  fov: number
  invertY: boolean
  muted: boolean
  binds: Binds
  colorblind: ColorblindMode
}

interface SettingsState extends SettingsShape {
  set: (p: Partial<SettingsShape>) => void
}

// Gfx tiers map to js/world.js:43 applyGfx
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      sensitivity: 1,
      volume: 0.6,
      gfx: 'medium',
      fov: 75,
      invertY: false,
      muted: false,
      binds: { ...DEFAULT_BINDS },
      colorblind: 'off',
      set: (p) => set(p),
    }),
    {
      name: 'voxel-r3f-settings',
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<SettingsShape>),
        binds: { ...DEFAULT_BINDS, ...((persisted as Partial<SettingsShape>)?.binds ?? {}) },
        colorblind: sanitizeColorblind((persisted as Partial<SettingsShape>)?.colorblind),
      }),
    },
  ),
)

export function gfxConfig(gfx: GfxTier): { dpr: number; shadows: boolean; shadowSize: number; fogNear: number; fogFar: number } {
  if (gfx === 'low') return { dpr: 1, shadows: false, shadowSize: 512, fogNear: 40, fogFar: 110 }
  if (gfx === 'high') return { dpr: 2, shadows: true, shadowSize: 2048, fogNear: 50, fogFar: 150 }
  return { dpr: 1.5, shadows: true, shadowSize: 1024, fogNear: 50, fogFar: 150 }
}

export function effectiveVolume(volume: number, muted: boolean): number {
  return muted ? 0 : volume
}
