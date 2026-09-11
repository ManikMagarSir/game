import { create } from 'zustand'
import { generateLayout, type WorldLayout } from '../three/worldData'

interface WorldState {
  layout: WorldLayout
  seed: number
  damageCrate: (index: number, dmg: number) => boolean
  regenerate: (seed: number) => void
}

export const useWorldStore = create<WorldState>((set) => ({
  layout: generateLayout(1337),
  seed: 1337,
  damageCrate: (index, dmg) => {
    let destroyed = false
    set((s) => {
      const crates = s.layout.crates.slice()
      const c = { ...crates[index] }
      c.hp -= dmg
      if (c.hp <= 0) {
        crates.splice(index, 1)
        destroyed = true
      } else {
        crates[index] = c
      }
      return { layout: { ...s.layout, crates } }
    })
    return destroyed
  },
  regenerate: (seed) => set({ seed, layout: generateLayout(seed) }),
}))
