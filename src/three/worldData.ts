import { GROUND_SIZE } from '../game/constants'
import { mulberry32 } from '../lib/math'

export interface CrateData { x: number; z: number; s: number; h: number; ry: number; tint: boolean; hp: number; radius: number }
export interface TreeData { x: number; z: number }
export interface RockData { x: number; z: number; s: number; ry: number }

export interface WorldLayout { crates: CrateData[]; trees: TreeData[]; rocks: RockData[] }

// Mirrors js/world.js:97 buildWorld distribution, but seeded + pure.
export function generateLayout(seed = 1337): WorldLayout {
  const rand = mulberry32(seed)
  const crates: CrateData[] = []
  for (let k = 0; k < 80; k++) {
    const s = 1.2 + rand() * 2.4
    const h = s * (0.8 + rand() * 1.7)
    const ang = rand() * Math.PI * 2
    const dist = 9 + rand() * (GROUND_SIZE / 2 - 14)
    crates.push({
      x: Math.cos(ang) * dist,
      z: Math.sin(ang) * dist,
      s, h,
      ry: rand() * Math.PI,
      tint: rand() < 0.5,
      hp: 60,
      radius: s / 2,
    })
  }
  const trees: TreeData[] = []
  for (let k = 0; k < 14; k++) {
    const px = (rand() - 0.5) * (GROUND_SIZE - 30)
    const pz = (rand() - 0.5) * (GROUND_SIZE - 30)
    if (Math.hypot(px, pz) < 12) continue
    trees.push({ x: px, z: pz })
  }
  const rocks: RockData[] = []
  for (let k = 0; k < 10; k++) {
    rocks.push({
      x: (rand() - 0.5) * (GROUND_SIZE - 30),
      z: (rand() - 0.5) * (GROUND_SIZE - 30),
      s: 1 + rand() * 1.6,
      ry: rand() * Math.PI,
    })
  }
  return { crates, trees, rocks }
}

// Circle-vs-circle push-out, port of js/world.js:154 collidePlayer
export function collideCircle(
  px: number, pz: number, pr: number,
  obstacles: { x: number; z: number; radius: number }[],
): { x: number; z: number } {
  let x = px, z = pz
  for (const o of obstacles) {
    const r = o.radius + pr
    const ox = x - o.x, oz = z - o.z
    const d2 = ox * ox + oz * oz
    if (d2 < r * r && d2 > 0.0001) {
      const d = Math.sqrt(d2)
      const push = r - d
      x += (ox / d) * push
      z += (oz / d) * push
    }
  }
  return { x, z }
}
