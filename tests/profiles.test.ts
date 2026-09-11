import { describe, expect, it } from 'vitest'
import { sanitizeProfile } from '../src/systems/storage'
import { blankData } from '../src/systems/storage'

describe('profile compat', () => {
  it('migrates legacy object-map ownedWeapons without wipe', () => {
    const legacy = { ...blankData(), ownedWeapons: { 0: true, 3: true, 7: true } }
    const out = sanitizeProfile(legacy)
    expect(out.ownedWeapons[3]).toBe(true)
    expect(out.ownedWeapons[7]).toBe(true)
    expect(out.ownedWeapons[1]).toBe(false)
  })
  it('rejects array-shaped ownedWeapons back to default', () => {
    const out = sanitizeProfile({ ...blankData(), ownedWeapons: [true] })
    expect(out.ownedWeapons[0]).toBe(true)
  })
})
