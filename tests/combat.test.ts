import { describe, expect, it } from 'vitest'
import { WEAPONS } from '../src/game/config'
import { bulletDamage, computeSpread, meleeDamage, pelletsFor, pierceFor, nextXp, xpForKill } from '../src/game/balance'
import { defaultMult } from '../src/game/types'

describe('combat', () => {
  it('computes spread like js/weapons.js:65', () => {
    const w = WEAPONS[0]
    expect(computeSpread(w, { aiming: true, moving: false, sprinting: false, recoilP: 0 })).toBeCloseTo(0.004)
    expect(computeSpread(w, { aiming: false, moving: true, sprinting: true, recoilP: 0.1 })).toBeCloseTo(0.012 + 0.025 + 0.05 + 0.04)
  })
  it('pellets/pierce/damage', () => {
    const m = { ...defaultMult(), pellets: 1, pierce: 1 }
    expect(pelletsFor(WEAPONS[2], m)).toBe(10)
    expect(pierceFor(m)).toBe(2)
    expect(bulletDamage(WEAPONS[0], defaultMult(), false)).toBe(34)
    expect(bulletDamage(WEAPONS[0], defaultMult(), true)).toBe(85)
    expect(meleeDamage(defaultMult())).toBe(30)
  })
})

describe('progression', () => {
  it('xp curve matches js/progression.js:13', () => {
    expect(nextXp(50)).toBe(90)
    expect(xpForKill(1, 100, false)).toBe(12)
    expect(xpForKill(1, 100, true)).toBe(48)
  })
})
