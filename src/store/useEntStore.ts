import { create } from 'zustand'

export interface Projectile { id: number; x: number; y: number; z: number; vx: number; vy: number; vz: number; life: number; dmg: number }
export interface GrenadeEnt { id: number; x: number; y: number; z: number; vx: number; vy: number; vz: number; fuse: number }
export interface PickupEnt { id: number; x: number; z: number; type: 'health' | 'grenade'; t: number }
export interface TurretEnt { id: number; x: number; z: number; cd: number; yaw: number }

let nextId = 1

interface EntState {
  projectiles: Projectile[]
  grenades: GrenadeEnt[]
  pickups: PickupEnt[]
  turrets: TurretEnt[]
  fireSpit: (x: number, z: number, tx: number, tz: number, dmg: number) => void
  addProjectile: (x: number, y: number, z: number, vx: number, vy: number, vz: number, life: number, dmg: number) => void
  throwGrenade: (x: number, y: number, z: number, dx: number, dz: number) => void
  spawnPickup: (x: number, z: number, type: 'health' | 'grenade') => void
  deployTurret: (x: number, z: number) => boolean
  clear: () => void
}

export const useEntStore = create<EntState>((set) => ({
  projectiles: [],
  grenades: [],
  pickups: [],
  turrets: [],
  fireSpit: (x, z, tx, tz, dmg) => {
    const ox = x, oy = 1.4, oz = z
    const dx = tx - ox, dz = tz - oz
    const len = Math.hypot(dx, 1.2, dz) || 1
    set((s) => ({
      projectiles: [...s.projectiles.slice(-30), {
        id: nextId++, x: ox, y: oy, z: oz,
        vx: (dx / len) * 16, vy: (1.2 / len) * 16, vz: (dz / len) * 16,
        life: 2.5, dmg,
      }],
    }))
  },
  addProjectile: (x, y, z, vx, vy, vz, life, dmg) =>
    set((s) => ({
      projectiles: [...s.projectiles.slice(-60), { id: nextId++, x, y, z, vx, vy, vz, life, dmg }],
    })),
  throwGrenade: (x, y, z, dx, dz) =>
    set((s) => ({
      grenades: [...s.grenades, {
        id: nextId++, x, y, z,
        vx: dx * 22, vy: 6, vz: dz * 22,
        fuse: 1.5,
      }],
    })),
  spawnPickup: (x, z, type) =>
    set((s) => ({ pickups: [...s.pickups.slice(-20), { id: nextId++, x, z, type, t: 0 }] })),
  deployTurret: (x, z) => {
    if (useEntStore.getState().turrets.length >= 2) return false
    set((s) => ({ turrets: [...s.turrets, { id: nextId++, x, z, cd: 0.5, yaw: 0 }] }))
    return true
  },
  clear: () => set({ projectiles: [], grenades: [], pickups: [], turrets: [] }),
}))
