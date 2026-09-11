import { describe, expect, it } from 'vitest'
import { raySphere, sortHits } from '../src/systems/rays'

describe('rays', () => {
  it('hits sphere ahead', () => {
    const d = raySphere(0, 0, 0, 0, 0, -1, { x: 0, y: 0, z: -10, r: 1, id: 1, head: false }, 200)
    expect(d).toBeCloseTo(9, 5)
  })
  it('misses sphere behind/off-axis', () => {
    expect(raySphere(0, 0, 0, 0, 0, -1, { x: 0, y: 0, z: 10, r: 1, id: 1, head: false }, 200)).toBeNull()
    expect(raySphere(0, 0, 0, 0, 0, -1, { x: 5, y: 0, z: -10, r: 1, id: 1, head: false }, 200)).toBeNull()
  })
  it('sorts nearest first', () => {
    const hits = sortHits(0, 0, 0, 0, 0, -1, [
      { x: 0, y: 0, z: -20, r: 1, id: 2, head: false },
      { x: 0, y: 0, z: -5, r: 1, id: 1, head: true },
    ], 200)
    expect(hits.map((h) => h.s.id)).toEqual([1, 2])
  })
})
