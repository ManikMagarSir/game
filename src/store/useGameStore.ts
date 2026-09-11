import { create } from 'zustand'
import type { GameMode, GamePhase } from '../game/types'
import { defaultMult, defaultOwnedWeapons, type Attach, type Career, type Mult, type OwnedWeapons } from '../game/types'
import { BEACON_MAX_HP, TIME_ATTACK_SECS } from '../game/constants'
import { CAREER_UPGRADES, SHOP_ITEMS } from '../game/config'
import { audio } from '../systems/audio'
import { playerRef } from './playerRef'
import { useFxStore } from './useFxStore'
import { useProfileStore } from './useProfileStore'

interface GameState {
  phase: GamePhase
  mode: GameMode
  wave: number
  kills: number
  score: number
  cash: number
  xp: number
  level: number
  xpToNext: number
  waveActive: boolean
  toSpawn: number
  spawnTimer: number
  intermission: number
  combo: number
  comboTimer: number
  health: number
  maxHealth: number
  mult: Mult
  hitStop: number
  pendingLevelUps: number
  curWeapon: number
  ownedWeapons: OwnedWeapons
  grenades: number
  god: boolean
  timer: number
  beaconHp: number
  beaconMaxHp: number
  overTitle: string
  attach: Attach
  career: Career
  shots: number
  hits: number
  headshots: number
  setPhase: (p: GamePhase) => void
  startRun: (mode: GameMode) => void
  selectWeapon: (i: number) => void
  cycleWeapon: (dir: number) => void
  addKill: (score: number, cash: number, xp: number) => void
  hurt: (dmg: number, fromX?: number, fromZ?: number) => boolean
  heal: (n: number) => void
  tickCombo: (dt: number) => void
  buyShopItem: (id: string) => void
  buyCareer: (id: 'health' | 'cash' | 'grenades' | 'rifle') => void
  bankCredits: (n: number) => void
  recordShots: (shots: number, hits: number, heads: number) => void
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'lobby',
  mode: 'endless',
  wave: 0,
  kills: 0,
  score: 0,
  cash: 0,
  xp: 0,
  level: 1,
  xpToNext: 50,
  waveActive: false,
  toSpawn: 0,
  spawnTimer: 0,
  intermission: 3,
  combo: 0,
  comboTimer: 0,
  health: 100,
  maxHealth: 100,
  mult: defaultMult(),
  hitStop: 0,
  pendingLevelUps: 0,
  curWeapon: 0,
  ownedWeapons: defaultOwnedWeapons(),
  grenades: 3,
  god: false,
  timer: 0,
  beaconHp: BEACON_MAX_HP,
  beaconMaxHp: BEACON_MAX_HP,
  overTitle: '',
  attach: { mag: 0, sup: 0, scope: 0 },
  career: loadCareer(),
  shots: 0,
  hits: 0,
  headshots: 0,
  setPhase: (phase) => set({ phase }),
  startRun: (mode) => {
    const career = get().career
    const owned: OwnedWeapons = { ...defaultOwnedWeapons() }
    if (career.upg.rifle) owned[3] = true
    if (mode === 'sandbox') for (let i = 1; i < 8; i++) owned[i] = true
    return set({
      mode, phase: 'playing', wave: 0, kills: 0, score: 0,
      cash: 100 * career.upg.cash,
      xp: 0, level: 1, xpToNext: 50, waveActive: false, toSpawn: 0,
      spawnTimer: 0, intermission: 3, combo: 0, comboTimer: 0,
      health: 100 + 20 * career.upg.health, maxHealth: 100 + 20 * career.upg.health,
      mult: defaultMult(), hitStop: 0, pendingLevelUps: 0,
      curWeapon: 0, ownedWeapons: owned,
      grenades: mode === 'sandbox' ? 99 : 3 + career.upg.grenades,
      god: mode === 'sandbox',
      timer: mode === 'time' ? TIME_ATTACK_SECS : 0,
      beaconHp: BEACON_MAX_HP, beaconMaxHp: BEACON_MAX_HP, overTitle: '',
      attach: { mag: 0, sup: 0, scope: 0 },
      shots: 0, hits: 0, headshots: 0,
    })
  },
  recordShots: (shots: number, hits: number, heads: number) =>
    set((s) => ({ shots: s.shots + shots, hits: s.hits + hits, headshots: s.headshots + heads })),
  selectWeapon: (i) => {
    const s = get()
    if (s.ownedWeapons[i] && i !== s.curWeapon) {
      playerRef.switchCd = 0.35
      playerRef.weaponTimer = 0
      set({ curWeapon: i })
    }
  },
  cycleWeapon: (dir) => {
    const s = get()
    let i = s.curWeapon
    for (let n = 0; n < 8; n++) {
      i = (i + dir + 8) % 8
      if (s.ownedWeapons[i]) break
    }
    if (i !== s.curWeapon) {
      playerRef.switchCd = 0.35
      playerRef.weaponTimer = 0
      set({ curWeapon: i })
    }
  },
  addKill: (score, cash, xp) =>
    set((s) => {
      const combo = s.combo + 1
      const mult = 1 + Math.floor(combo / 5) * 0.5
      const gained = Math.round(score * mult)
      let { xp: nxp, level, xpToNext, pendingLevelUps } = s
      nxp += Math.round(xp)
      while (nxp >= xpToNext) {
        nxp -= xpToNext
        level++
        xpToNext = Math.floor(xpToNext * 1.3 + 25)
        pendingLevelUps++
      }
      return {
        kills: s.kills + 1, combo, comboTimer: 3,
        score: s.score + gained * 2,
        cash: s.cash + Math.round(cash * mult),
        xp: nxp, level, xpToNext, pendingLevelUps,
        hitStop: Math.min(0.09, s.hitStop + 0.05),
      }
    }),
  hurt: (dmg, fromX, fromZ) => {
    const s = get()
    if (s.god) return false
    if (fromX !== undefined && fromZ !== undefined) {
      try {
        // Screen-relative angle of the attacker for the directional indicator
        const dx = fromX - playerRef.x, dz = fromZ - playerRef.z
        const rel = playerRef.yaw + Math.PI - Math.atan2(dx, dz)
        useFxStore.getState().pingDamage(rel)
      } catch { /* fx only */ }
    }
    const health = Math.max(0, s.health - dmg)
    set({ health })
    return health <= 0
  },
  heal: (n) => set((s) => ({ health: Math.min(s.maxHealth, s.health + n) })),
  tickCombo: (dt) =>
    set((s) => (s.comboTimer > 0 ? (s.comboTimer - dt <= 0 ? { comboTimer: 0, combo: 0 } : { comboTimer: s.comboTimer - dt }) : {})),
  buyShopItem: (id) =>
    set((s) => {
      const item = SHOP_ITEMS.find((i) => i.id === id)
      if (!item || s.cash < item.cost) return {}
      if (item.once && shopKeyOwned(item.key, s.ownedWeapons, s.attach)) return {}
      const cash = s.cash - item.cost
      const mult = { ...s.mult }
      let { health, maxHealth, grenades, ownedWeapons, attach } = s
      ownedWeapons = { ...s.ownedWeapons }
      attach = { ...s.attach }
      switch (id) {
        case 'medkit': health = Math.min(maxHealth, health + 50); break
        case 'nade': grenades += 3; break
        case 'dmg': mult.damage *= 1.1; break
        case 'rof': mult.fireRate *= 0.92; break
        case 'hp': maxHealth += 20; health += 20; break
        case 'spd': mult.speed *= 1.08; break
        case 'attSup': attach.sup = 1; break
        case 'attScope': attach.scope = 1; break
        default: {
          const m = id.match(/^unlock(\d)$/)
          if (m) ownedWeapons[+m[1]] = true
          break
        }
      }
      audio.tone(880, 0.08, 'square', 0.05)
      return { cash, mult, health, maxHealth, grenades, ownedWeapons, attach }
    }),
  buyCareer: (id) =>
    set((s) => {
      const up = CAREER_UPGRADES.find((u) => u.id === id)
      if (!up) return {}
      const lvl = s.career.upg[id]
      if (lvl >= up.max) return {}
      const cost = up.cost(lvl)
      if (s.career.credits < cost) return {}
      const career: Career = { credits: s.career.credits - cost, upg: { ...s.career.upg, [id]: lvl + 1 } }
      saveCareer(career)
      try { useProfileStore.getState().patch({ career }) } catch { /* boot */ }
      audio.tone(440, 0.04, 'square', 0.04)
      return { career }
    }),
  bankCredits: (n) =>
    set((s) => {
      const career: Career = { ...s.career, credits: s.career.credits + n }
      saveCareer(career)
      try { useProfileStore.getState().patch({ career }) } catch { /* boot */ }
      return { career }
    }),
}))

function shopKeyOwned(key: string | undefined, owned: OwnedWeapons, attach: Attach): boolean {
  if (!key) return false
  if (key[0] === 'w') return !!owned[+key[1]]
  if (key === 'sup') return !!attach.sup
  if (key === 'scope') return !!attach.scope
  return false
}

const CAREER_KEY = 'voxel-r3f-career'
function loadCareer(): Career {
  try {
    const raw = JSON.parse(localStorage.getItem(CAREER_KEY) || 'null')
    if (raw && typeof raw === 'object') {
      const u = (raw.upg ?? {}) as Record<string, number>
      return {
        credits: Math.max(0, Math.floor(Number(raw.credits) || 0)),
        upg: {
          health: Math.max(0, Math.floor(Number(u.health) || 0)),
          cash: Math.max(0, Math.floor(Number(u.cash) || 0)),
          grenades: Math.max(0, Math.floor(Number(u.grenades) || 0)),
          rifle: Math.max(0, Math.floor(Number(u.rifle) || 0)),
        },
      }
    }
  } catch { /* fresh */ }
  return { credits: 0, upg: { health: 0, cash: 0, grenades: 0, rifle: 0 } }
}
function saveCareer(c: Career): void {
  try { localStorage.setItem(CAREER_KEY, JSON.stringify(c)) } catch { /* quota */ }
}
