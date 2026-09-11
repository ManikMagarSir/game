import type { Mult } from '../game/types'

export function applyAbility(id: string, mult: Mult, hp: { max: number; cur: number }): { mult: Mult; hp: { max: number; cur: number } } {
  const m = { ...mult }
  const h = { ...hp }
  switch (id) {
    case 'dmg': m.damage *= 1.25; break
    case 'rof': m.fireRate *= 0.82; break
    case 'hp': h.max += 30; h.cur = Math.min(h.max, h.cur + 30); break
    case 'speed': m.speed *= 1.13; break
    case 'multi': m.pellets += 1; break
    case 'pierce': m.pierce += 1; break
    case 'head': m.head += 0.4; break
    case 'vamp': m.lifesteal += 3; break
  }
  return { mult: m, hp: h }
}
