// Ray vs sphere helpers for hitscan — pure, tested. Replaces per-pellet
// THREE.Raycaster vs all hitMeshes in js/weapons.js:72 with cheap math.
export interface Sphere { x: number; y: number; z: number; r: number; id: number; head: boolean }

export function raySphere(
  ox: number, oy: number, oz: number,
  dx: number, dy: number, dz: number,
  s: Sphere, maxDist: number,
): number | null {
  const lx = s.x - ox, ly = s.y - oy, lz = s.z - oz
  const tca = lx * dx + ly * dy + lz * dz
  if (tca < 0 || tca > maxDist) return null
  const d2 = lx * lx + ly * ly + lz * lz - tca * tca
  const r2 = s.r * s.r
  if (d2 > r2) return null
  const thc = Math.sqrt(r2 - d2)
  return Math.max(0, tca - thc)
}

export function sortHits(
  ox: number, oy: number, oz: number,
  dx: number, dy: number, dz: number,
  spheres: Sphere[], maxDist: number,
): { dist: number; s: Sphere }[] {
  const out: { dist: number; s: Sphere }[] = []
  for (const s of spheres) {
    const d = raySphere(ox, oy, oz, dx, dy, dz, s, maxDist)
    if (d !== null) out.push({ dist: d, s })
  }
  out.sort((a, b) => a.dist - b.dist)
  return out
}
