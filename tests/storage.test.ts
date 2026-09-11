import { describe, expect, it } from 'vitest'
import { blankData, sanitizeProfile } from '../src/systems/storage'

describe('storage sanitize (legacy js/storage.js:104 bug)', () => {
  it('preserves object-map ownedWeapons instead of wiping', () => {
    const input = { ...blankData(), ownedWeapons: { 0: true, 3: true } }
    const out = sanitizeProfile(input)
    expect(out.ownedWeapons[3]).toBe(true)
    expect(out.ownedWeapons[0]).toBe(true)
  })
  it('falls back to blank on garbage', () => {
    const out = sanitizeProfile(null)
    expect(out.ownedWeapons[0]).toBe(true)
    expect(out.settings.gfx).toBe('medium')
  })
})
