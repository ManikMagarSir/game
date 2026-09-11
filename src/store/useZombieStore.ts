import { create } from 'zustand'
import type { ZombieKind } from '../game/types'
import { scaledZombieDmg, scaledZombieHp } from '../game/balance'
import { ZTYPES } from '../game/config'

export type BossPhase = 'idle' | 'charge' | 'slam' | 'summon' | 'nova' | 'volley'

export interface ZombieEnt {
  id: number
  kind: ZombieKind
  x: number
  z: number
  hp: number
  maxHp: number
  speed: number
  dmg: number
  walk: number
  attackCd: number
  hitFlash: number
  shieldHp: number
  summonCd: number
  rage: number
  rageT: number
  phase: BossPhase
  phaseT: number
  abilityCd: number
  atkAnim: number
  chargeVx: number
  chargeVz: number
  chargeDmg: number
}

let nextId = 1
interface ZombieState {
  list: ZombieEnt[]
  spawn: (kind: ZombieKind, wave: number, x?: number, z?: number) => void
  damage: (id: number, dmg: number) => ZombieEnt | null // returns updated or null if killed
  remove: (id: number) => void
  clear: () => void
  tick: (fn: (z: ZombieEnt) => ZombieEnt | null) => void
}

export function spawnPos(): { x: number; z: number } {
  const ang = Math.random() * Math.PI * 2
  const dist = 32 + Math.random() * 18
  return { x: Math.cos(ang) * dist, z: Math.sin(ang) * dist }
}

export const useZombieStore = create<ZombieState>((set) => ({
  list: [],
  spawn: (kind, wave, x, z) => {
    const p = x === undefined || z === undefined ? spawnPos() : { x, z }
    const t = ZTYPES[kind]
    const isBoss = kind === 'boss'
    const hp = scaledZombieHp(kind, wave)
    set((s) => ({
      list: [
        ...s.list,
        {
          id: nextId++,
          kind,
          x: p.x, z: p.z,
          hp, maxHp: hp,
          speed: isBoss ? t.speed : t.speed + wave * 0.03,
          dmg: isBoss ? t.dmg + wave * 1.5 : scaledZombieDmg(kind, wave),
          walk: Math.random() * Math.PI * 2,
          attackCd: 0,
          hitFlash: 0,
          shieldHp: kind === 'shield' ? 260 : 0,
          summonCd: kind === 'screamer' ? 3 : 0,
          rage: isBoss ? 1 : 0,
          rageT: 0,
          phase: 'idle',
          phaseT: 0,
          abilityCd: isBoss ? 3 : 0,
          atkAnim: 0,
          chargeVx: 0,
          chargeVz: 0,
          chargeDmg: 0,
        },
      ],
    }))
  },
  damage: (id, dmg) => {
    let out: ZombieEnt | null = null
    set((s) => ({
      list: s.list
        .map((z) => {
          if (z.id !== id) return z
          const hp = z.hp - dmg
          if (hp <= 0) {
            out = null
            return null
          }
          out = { ...z, hp, hitFlash: 0.08 }
          return out
        })
        .filter((z): z is ZombieEnt => z !== null),
    }))
    return out
  },
  remove: (id) => set((s) => ({ list: s.list.filter((z) => z.id !== id) })),
  clear: () => set({ list: [] }),
  tick: (fn) =>
    set((s) => ({
      list: s.list.map((z) => fn(z)).filter((z): z is ZombieEnt => z !== null),
    })),
}))
