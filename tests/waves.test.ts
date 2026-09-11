import { describe, expect, it } from 'vitest'
import { isBossWave, pickSpawnType, scaledZombieDmg, scaledZombieHp, spawnInterval, waveSize } from '../src/game/balance'

describe('waves', () => {
  it('sizes waves like legacy js/waves.js:6', () => {
    expect(waveSize(1, 'endless', false)).toBe(8)
    expect(waveSize(5, 'endless', true)).toBe(11)
  })
  it('flags boss waves', () => {
    expect(isBossWave(5, 'endless')).toBe(true)
    expect(isBossWave(3, 'endless')).toBe(false)
    expect(isBossWave(2, 'bossrush')).toBe(true)
  })
  it('clamps spawn interval', () => {
    expect(spawnInterval(1)).toBeCloseTo(1.05)
    expect(spawnInterval(30)).toBe(0.25)
  })
  it('picks spawn types by wave gates', () => {
    expect(pickSpawnType(1, 'endless', 0.99)).toBe('normal')
    expect(pickSpawnType(3, 'endless', 0.6)).toBe('runner')
    expect(pickSpawnType(6, 'endless', 0.05)).toBe('screamer')
    expect(pickSpawnType(9, 'sandbox', 0.01)).toBe('normal')
  })
  it('scales hp/dmg', () => {
    expect(scaledZombieHp('normal', 10)).toBe(120)
    expect(scaledZombieDmg('normal', 10)).toBeCloseTo(16)
    expect(scaledZombieHp('boss', 2)).toBeGreaterThan(5000)
  })
})
