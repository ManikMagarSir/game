// Voxel Survivor — shared game types (port of js/config.js + js/state.js shapes)
export type GameMode = 'endless' | 'time' | 'bossrush' | 'defense' | 'sandbox'
export type GamePhase = 'lobby' | 'intro' | 'playing' | 'paused' | 'levelup' | 'shop' | 'sandbox' | 'gameover'
export type GfxTier = 'low' | 'medium' | 'high'

export interface WeaponDef {
  id: number
  name: string
  auto: boolean
  dmg: number
  cd: number
  pellets: number
  spread: number
  mag: number
  reload: number
  range: number
  recoil: number
  sfx: string
}

export interface AbilityDef {
  id: string
  ico: string
  name: string
  desc: string
}

export type ZombieKind =
  | 'normal'
  | 'runner'
  | 'brute'
  | 'boss'
  | 'spitter'
  | 'exploder'
  | 'screamer'
  | 'shield'
  | 'crawler'

export interface ZombieTypeDef {
  hp: number
  speed: number
  scale: number
  color: number
  dmg: number
  score: number
  cash: number
  groan: [number, number]
  ranged?: boolean
  boom?: boolean
  summon?: boolean
  shielded?: boolean
}

export interface ShopItemDef {
  id: string
  name: string
  ico: string
  desc: string
  cost: number
  once?: boolean
  key?: string
}

export interface CareerUpgradeDef {
  id: 'health' | 'cash' | 'grenades' | 'rifle'
  name: string
  ico: string
  desc: string
  max: number
  cost: (lvl: number) => number
}

export interface Mult {
  damage: number
  fireRate: number
  reload: number
  speed: number
  pellets: number
  pierce: number
  head: number
  mag: number
  lifesteal: number
}

export interface Attach { mag: number; sup: number; scope: number }

export interface OwnedWeapons { [id: number]: boolean }

export interface Career { credits: number; upg: Record<'health' | 'cash' | 'grenades' | 'rifle', number> }
export interface Best { score: number; wave: number }
export interface Settings { sensitivity: number; volume: number; gfx: GfxTier }

export interface ProfileData {
  career: Career
  settings: Settings
  best: Best
  ownedWeapons: OwnedWeapons
  leaderboard: number[]
}

export function defaultMult(): Mult {
  return { damage: 1, fireRate: 1, reload: 1, speed: 1, pellets: 0, pierce: 0, head: 2.5, mag: 0, lifesteal: 0 }
}

export function defaultOwnedWeapons(): OwnedWeapons {
  return { 0: true, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false }
}
