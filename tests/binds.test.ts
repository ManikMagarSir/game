import { describe, expect, it } from 'vitest'
import { DEFAULT_BINDS, moveState, sanitizeBinds } from '../src/lib/binds'

describe('binds', () => {
  it('falls back to defaults on garbage', () => {
    expect(sanitizeBinds(null)).toEqual(DEFAULT_BINDS)
    expect(sanitizeBinds({ forward: 'KeyT', bogus: 1 }).forward).toBe('KeyT')
    expect(sanitizeBinds({ forward: 'KeyT', bogus: 1 }).back).toBe('KeyS')
  })
  it('reads movement with arrow fallbacks', () => {
    const b = { ...DEFAULT_BINDS }
    expect(moveState({ KeyW: true }, b).f).toBe(true)
    expect(moveState({ ArrowUp: true }, b).f).toBe(true)
    expect(moveState({ ShiftRight: true }, b).sprint).toBe(true)
    expect(moveState({}, b).f).toBe(false)
  })
})
