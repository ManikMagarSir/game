// Pure balance formulas — ported from js/waves.js, js/progression.js, js/weapons.js, js/zombies.js
// All functions pure + unit-tested. No THREE, no DOM.
import type { GameMode, Mult, WeaponDef, ZombieKind } from './types'
import { ZTYPES } from './config'

export function waveSize(wave: number, mode: GameMode, bossWave: boolean): number {
  if (bossWave) return 6 + wave
  void mode
  return 5 + wave * 3
}

export function isBossWave(wave: number, mode: GameMode): boolean {
  return mode === 'bossrush' || wave % 5 === 0
}

export function spawnInterval(wave: number): number {
  return Math.max(0.25, 1.1 - wave * 0.05)
}

export function pickSpawnType(wave: number, mode: GameMode, rand: number = Math.random()): ZombieKind {
  if (mode === 'sandbox') return 'normal'
  const r = rand
  if (wave >= 6 && r < 0.12) return 'screamer'
  if (wave >= 5 && r < 0.24) return 'shield'
  if (wave >= 4 && r < 0.34) return 'spitter'
  if (wave >= 5 && r < 0.42) return 'exploder'
  if (wave >= 4 && r < 0.5) return 'brute'
  if (wave >= 3 && r < 0.62) return 'runner'
  if (wave >= 3 && r < 0.72) return 'crawler'
  return 'normal'
}

export function scaledZombieHp(kind: ZombieKind, wave: number): number {
  const base = ZTYPES[kind].hp
  if (kind === 'boss') return Math.round(base * Math.pow(1.22, wave - 1))
  return Math.round(base * (1 + wave * 0.1))
}

export function scaledZombieDmg(kind: ZombieKind, wave: number): number {
  return ZTYPES[kind].dmg + wave * 0.8
}

export function xpForKill(wave: number, maxHp: number, isBoss: boolean): number {
  let xp = 10 + wave * 2 + (maxHp > 120 ? 5 : 0)
  if (isBoss) xp *= 4
  return xp
}

export function nextXp(xpToNext: number): number {
  return Math.floor(xpToNext * 1.3 + 25)
}

export function computeSpread(
  w: WeaponDef,
  opts: { aiming: boolean; moving: boolean; sprinting: boolean; recoilP: number },
): number {
  let spread = w.spread + (opts.aiming ? -0.008 : 0) + (opts.moving ? 0.025 : 0) + (opts.sprinting ? 0.05 : 0) + opts.recoilP * 0.4
  return Math.max(0, spread)
}

export function pelletsFor(w: WeaponDef, mult: Mult): number {
  return w.pellets + mult.pellets
}

export function pierceFor(mult: Mult): number {
  return 1 + mult.pierce
}

export function bulletDamage(w: WeaponDef, mult: Mult, isHead: boolean): number {
  let dmg = w.dmg * mult.damage
  if (isHead) dmg *= mult.head
  return dmg
}

export function meleeDamage(mult: Mult): number {
  return 30 * mult.damage
}

export function shopOwned(key: string | undefined, once: boolean | undefined, ownedWeapons: Record<number, boolean>, attach: { sup: number; scope: number }): boolean {
  if (!once || !key) return false
  if (key[0] === 'w') return !!ownedWeapons[+key[1]]
  if (key === 'sup') return !!attach.sup
  if (key === 'scope') return !!attach.scope
  return false
}
