import { describe, expect, it } from 'vitest'
import { collideCircle, generateLayout } from '../src/three/worldData'

describe('world layout', () => {
  it('generates deterministic crates/trees/rocks', () => {
    const a = generateLayout(1337)
    const b = generateLayout(1337)
    expect(a.crates.length).toBe(80)
    expect(a.crates).toEqual(b.crates)
    expect(a.crates[0].hp).toBe(60)
  })
  it('pushes player out of crates like js/world.js:154', () => {
    const res = collideCircle(0.5, 0, 0.4, [{ x: 0, z: 0, radius: 1 }])
    expect(Math.hypot(res.x, res.z)).toBeCloseTo(1.4, 5)
  })
})
