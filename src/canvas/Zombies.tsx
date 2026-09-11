import { useFrame } from '@react-three/fiber'
import { playerRef } from '../store/playerRef'
import { useGameStore } from '../store/useGameStore'
import { useProfileStore } from '../store/useProfileStore'
import { useZombieStore } from '../store/useZombieStore'
import { useEntStore } from '../store/useEntStore'
import { useFxStore } from '../store/useFxStore'
import { ZTYPES } from '../game/config'
import { xpForKill } from '../game/balance'
import { audio } from '../systems/audio'
import ZombieModel from '../three/models/ZombieModel'
import BossModel, { BOSS_FORMS } from '../three/models/BossModel'
import type { ZombieEnt } from '../store/useZombieStore'

// Full AI: seek + separation + spitter ranged + exploder suicide + screamer summon + boss.
// Port of js/zombies.js:299 updateBoss + js/zombies.js:500.
function die(id: string): void {
  const g = useGameStore.getState()
  g.bankCredits(Math.floor(g.score / 10))
  try {
    const best = JSON.parse(localStorage.getItem('voxel-r3f-best') || 'null') as { score: number; wave: number } | null
    if (!best || g.score > best.score || g.wave > best.wave) {
      localStorage.setItem('voxel-r3f-best', JSON.stringify({ score: Math.max(g.score, best?.score ?? 0), wave: Math.max(g.wave, best?.wave ?? 0) }))
    }
    const pb = useProfileStore.getState().bundle.best
    if (g.score > pb.score || g.wave > pb.wave) {
      useProfileStore.getState().patch({ best: { score: Math.max(g.score, pb.score), wave: Math.max(g.wave, pb.wave) } })
    }
  } catch { /* private mode */ }
  g.setPhase('gameover')
  useGameStore.setState({ overTitle: id })
  try { document.exitPointerLock() } catch { /* noop */ }
  audio.tone(330, 0.4, 'sawtooth', 0.05, 165)
}

export default function Zombies(): React.JSX.Element {
  const list = useZombieStore((s) => s.list)
  const projectiles = useEntStore((s) => s.projectiles)
  const grenades = useEntStore((s) => s.grenades)
  const pickups = useEntStore((s) => s.pickups)
  const turrets = useEntStore((s) => s.turrets)

  useFrame((_, rawDt) => {
    if (useGameStore.getState().phase !== 'playing') return
    const dt = Math.min(rawDt, 0.05)
    const gs = useGameStore.getState()
    const sdt = gs.hitStop > 0 ? dt * 0.15 : dt
    const zs = useZombieStore.getState().list
    const px = playerRef.x, pz = playerRef.z
    const beacon = gs.mode === 'defense' ? { x: 0, z: -20 } : null

    if (zs.length) {
      const next = zs.flatMap((z) => {
        if (z.kind === 'boss') return [updateBoss(z, sdt, px, pz)]
        // Defense targeting: closer of player/beacon (js/zombies.js:500)
        let tx = px, tz = pz, targetPlayer = true
        if (beacon) {
          const dp = (px - z.x) ** 2 + (pz - z.z) ** 2
          const db = (beacon.x - z.x) ** 2 + (beacon.z - z.z) ** 2
          if (db < dp) { tx = beacon.x; tz = beacon.z; targetPlayer = false }
        }
        const dx = tx - z.x, dz = tz - z.z
        const dist = Math.hypot(dx, dz)
        let { x, z: zz, attackCd, hitFlash, summonCd } = { x: z.x, z: z.z, attackCd: z.attackCd, hitFlash: Math.max(0, z.hitFlash - sdt), summonCd: z.summonCd }

        // Exploder suicide (js/zombies.js:506)
        if (z.kind === 'exploder' && dist < 2.4) {
          useFxStore.getState().burst(x, 1, zz, '#ff7722', 20)
          useFxStore.getState().caption('💥 Explosion nearby')
          audio.explosion()
          playerRef.shake = Math.max(playerRef.shake, 0.4)
          const d = Math.hypot(px - x, pz - zz)
          if (d < 8) {
            if (useGameStore.getState().hurt(26 * (1 - d / 8), x, zz)) die('BOOM')
          }
          const t = useGameStore.getState()
          t.addKill(20, 18, 10 + t.wave * 2)
          useFxStore.getState().pingKill()
          return []
        }

        // Spitter ranged hold (js/zombies.js:511)
        if (z.kind === 'spitter' && dist < 18 && dist > 5) {
          attackCd -= sdt
          if (attackCd <= 0) {
            attackCd = 1.4
            useEntStore.getState().fireSpit(x, zz, tx, tz, z.dmg)
          }
        } else if (dist > 1.4) {
          if (attackCd > 0) attackCd -= sdt
          const nx = dx / (dist || 1), nz = dz / (dist || 1)
          let sepX = 0, sepZ = 0
          const rr = z.kind === 'brute' || z.kind === 'shield' ? 1.6 : 1.1
          for (const o of zs) {
            if (o.id === z.id) continue
            const ox = x - o.x, oz = zz - o.z
            const d2 = ox * ox + oz * oz
            if (d2 < rr * rr && d2 > 0.0001) {
              const d = Math.sqrt(d2)
              sepX += (ox / d) * (rr - d)
              sepZ += (oz / d) * (rr - d)
            }
          }
          x += (nx * z.speed + sepX * z.speed * 0.6) * sdt
          zz += (nz * z.speed + sepZ * z.speed * 0.6) * sdt
        } else {
          attackCd -= sdt
          if (attackCd <= 0) {
            attackCd = 0.8
            if (targetPlayer) {
              if (useGameStore.getState().hurt(z.dmg, x, zz)) die('YOU DIED')
              playerRef.shake = Math.max(playerRef.shake, 0.2)
              audio.hurt()
            } else {
              const b = useGameStore.getState()
              const hp = Math.max(0, b.beaconHp - z.dmg)
              useGameStore.setState({ beaconHp: hp })
              if (hp <= 0) die('BEACON DESTROYED')
            }
          }
        }

        // Screamer summon, capped (js/zombies.js:583 + cap fix)
        if (z.kind === 'screamer') {
          summonCd -= sdt
          if (summonCd <= 0 && dist < 26 && useZombieStore.getState().list.length < 40) {
            summonCd = 6
            const wx = useGameStore.getState().wave
            useZombieStore.getState().spawn('normal', wx, x + 2, zz)
            useZombieStore.getState().spawn('normal', wx, x - 2, zz)
          }
        }
        return [{ ...z, x, z: zz, attackCd, hitFlash, summonCd, walk: z.walk + sdt * 6 }]
      })
      useZombieStore.setState({ list: next })
    }

    // Projectiles (js/zombies.js:201)
    const pr = useEntStore.getState().projectiles
    if (pr.length) {
      const kept = []
      for (const p of pr) {
        p.vy -= 12 * sdt
        p.x += p.vx * sdt; p.y += p.vy * sdt; p.z += p.vz * sdt
        p.life -= sdt
        const dx = p.x - playerRef.x, dy = p.y - 1.7, dz = p.z - playerRef.z
        if (dx * dx + dy * dy + dz * dz < 0.36) {
          if (useGameStore.getState().hurt(p.dmg, p.x, p.z)) die('YOU DIED')
          useFxStore.getState().burst(p.x, p.y, p.z, '#3a9a5a', 6)
          continue
        }
        if (p.life <= 0 || p.y < 0.1) continue
        kept.push(p)
      }
      useEntStore.setState({ projectiles: kept })
    }

    // Grenades (js/weapons.js:184)
    const gr = useEntStore.getState().grenades
    if (gr.length) {
      const kept = []
      for (const gg of gr) {
        gg.vy -= 18 * sdt
        gg.x += gg.vx * sdt; gg.y += gg.vy * sdt; gg.z += gg.vz * sdt
        if (gg.y < 0.2) { gg.y = 0.2; gg.vy *= -0.4; gg.vx *= 0.6; gg.vz *= 0.6 }
        gg.fuse -= sdt
        if (gg.fuse <= 0) {
          explode(gg.x, gg.z)
          continue
        }
        kept.push(gg)
      }
      useEntStore.setState({ grenades: kept })
    }

    // Pickups magnet + collect (js/zombies.js:129)
    const pk = useEntStore.getState().pickups
    if (pk.length) {
      const kept = []
      for (const p of pk) {
        p.t += sdt
        if (p.t > 20) continue
        const dx = playerRef.x - p.x, dz = playerRef.z - p.z
        if (dx * dx + dz * dz < 1.7 * 1.7) {
          if (p.type === 'health') {
            useGameStore.getState().heal(50)
            useFxStore.getState().caption('➕ +50 HP')
          } else {
            useGameStore.setState((s) => ({ grenades: s.grenades + 2 }))
            useFxStore.getState().caption('💣 +2 grenades')
          }
          audio.pickup()
          useFxStore.getState().burst(p.x, 1.2, p.z, '#3dff7a', 6)
          continue
        }
        kept.push(p)
      }
      useEntStore.setState({ pickups: kept })
    }

    // Turrets (E1): nearest target in 25m, 20dmg @ 4/s
    const tu = useEntStore.getState().turrets
    if (tu.length) {
      const zlist = useZombieStore.getState().list
      let dirty = false
      for (const t of tu) {
        t.cd -= sdt
        let best: { id: number; d: number } | null = null
        for (const z of zlist) {
          const d = Math.hypot(z.x - t.x, z.z - t.z)
          if (d < 25 && (!best || d < best.d)) best = { id: z.id, d }
        }
        if (best) {
          const target = zlist.find((z) => z.id === best.id)
          if (target) t.yaw = Math.atan2(target.x - t.x, target.z - t.z)
          if (t.cd <= 0) {
            t.cd = 0.25
            const tgt = useZombieStore.getState().list.find((z) => z.id === best.id)
            if (tgt) {
              const updated = useZombieStore.getState().damage(tgt.id, 20)
              useFxStore.getState().addTracer([t.x, 1.4, t.z], [tgt.x, 1.2, tgt.z])
              useFxStore.getState().burst(tgt.x, 1.2, tgt.z, '#ffcc44', 3)
              if (!updated) {
                const zt = ZTYPES[tgt.kind]
                const gg = useGameStore.getState()
                gg.addKill(zt.score, zt.cash, xpForKill(gg.wave, tgt.maxHp, tgt.kind === 'boss'))
                useFxStore.getState().pingKill()
              }
              dirty = true
            }
          } else dirty = true
        }
      }
      if (dirty) useEntStore.setState({ turrets: [...tu] })
    }
  })

  return (
    <group>
      {list.map((z) => {
        const yaw = Math.atan2(playerRef.x - z.x, playerRef.z - z.z)
        return (
          <group key={z.id} position={[z.x, 0, z.z]} rotation={[0, yaw, 0]}>
            {z.kind === 'boss' ? (
              <BossModel rage={z.rage} hitFlash={z.hitFlash} rageT={z.rageT} />
            ) : (
              <ZombieModel kind={z.kind} hitFlash={z.hitFlash} />
            )}
          </group>
        )
      })}
      {projectiles.map((p) => (
        <mesh key={p.id} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[0.18, 6, 6]} />
          <meshLambertMaterial color={0x3a9a5a} emissive={0x1a5a2a} />
        </mesh>
      ))}
      {grenades.map((g) => (
        <mesh key={g.id} position={[g.x, g.y, g.z]}>
          <boxGeometry args={[0.25, 0.25, 0.25]} />
          <meshLambertMaterial color={0x2a4a2a} />
        </mesh>
      ))}
      {pickups.map((p) => (
        <mesh key={p.id} position={[p.x, 0.6 + Math.sin(p.t * 3) * 0.12, p.z]} rotation={[0, p.t * 2, 0]} visible={p.t < 16 || Math.floor(p.t * 2) % 2 === 0}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshLambertMaterial color={p.type === 'health' ? 0xff4444 : 0x44ff44} emissive={p.type === 'health' ? 0x550000 : 0x005500} />
        </mesh>
      ))}
      {turrets.map((t) => (
        <group key={`turret-${t.id}`} position={[t.x, 0, t.z]}>
          <mesh position={[0, 0.3, 0]} castShadow>
            <boxGeometry args={[0.8, 0.6, 0.8]} />
            <meshLambertMaterial color={0x445566} />
          </mesh>
          <group position={[0, 0.9, 0]} rotation={[0, t.yaw, 0]}>
            <mesh position={[0, 0, -0.4]}>
              <boxGeometry args={[0.25, 0.25, 1.1]} />
              <meshLambertMaterial color={0x33363c} />
            </mesh>
            <mesh position={[0, 0.15, 0]}>
              <boxGeometry args={[0.5, 0.3, 0.5]} />
              <meshLambertMaterial color={0x4de7ff} emissive={0x2266ff} />
            </mesh>
          </group>
        </group>
      ))}
    </group>
  )
}

// Boss brain — port of js/zombies.js:299 updateBoss. Rage forms at 80/60/40/20% HP.
function updateBoss(z: ZombieEnt, sdt: number, px: number, pz: number): ZombieEnt {
  const fx = useFxStore.getState()
  let { x, attackCd, hitFlash, rage, rageT, phase, phaseT, abilityCd, atkAnim, chargeVx, chargeVz, chargeDmg } = {
    x: z.x, attackCd: z.attackCd, hitFlash: Math.max(0, z.hitFlash - sdt),
    rage: z.rage, rageT: z.rageT + sdt, phase: z.phase, phaseT: z.phaseT,
    abilityCd: z.abilityCd, atkAnim: Math.max(0, z.atkAnim - sdt),
    chargeVx: z.chargeVx, chargeVz: z.chargeVz, chargeDmg: z.chargeDmg,
  }
  let zz = z.z
  const dx = px - x, dz = pz - zz
  const dist = Math.hypot(dx, dz) || 0.001

  if (phase === 'charge') {
    phaseT -= sdt
    x += chargeVx * sdt
    zz += chargeVz * sdt
    if (Math.hypot(px - x, pz - zz) < 2.4 && useGameStore.getState().hurt(chargeDmg, x, zz)) die('CHARGED DOWN')
    if (phaseT <= 0) {
      phase = 'idle'
      abilityCd = 2.5 + Math.random() * 2
      fx.burst(x, 1.2, zz, '#ff7722', 16)
      audio.explosion()
      playerRef.shake = Math.max(playerRef.shake, 0.5)
      const d = Math.hypot(px - x, pz - zz)
      if (d < 7 && useGameStore.getState().hurt(Math.round(z.dmg * 0.9), x, zz)) die('YOU DIED')
    }
    return { ...z, x, z: zz, attackCd, hitFlash, rageT, phase, phaseT, abilityCd, atkAnim, chargeVx, chargeVz, chargeDmg }
  }
  if (phase === 'slam') {
    phaseT -= sdt
    if (phaseT <= 0) {
      phase = 'idle'
      abilityCd = 3 + Math.random() * 2
      fx.burst(x, 1, zz, '#ff6622', 22)
      audio.explosion()
      playerRef.shake = Math.max(playerRef.shake, 0.6)
      const d = Math.hypot(px - x, pz - zz)
      if (d < 6 && useGameStore.getState().hurt(Math.round(z.dmg * 1.2 * (1 - d / 6)), x, zz)) die('SLAMMED')
    }
    return { ...z, x, z: zz, attackCd, hitFlash, rageT, phase, phaseT, abilityCd, atkAnim, chargeVx, chargeVz, chargeDmg }
  }
  if (phase === 'summon') {
    phaseT -= sdt
    if (phaseT <= 0) {
      phase = 'idle'
      abilityCd = 4 + Math.random() * 2
      audio.tone(240, 0.5, 'sawtooth', 0.04, 90)
      const wv = useGameStore.getState().wave
      const n = 2 + Math.floor(rage / 2)
      for (let k = 0; k < n; k++) {
        useZombieStore.getState().spawn(k === 0 ? 'runner' : 'normal', wv, x + (Math.random() - 0.5) * 5, zz + (Math.random() - 0.5) * 5)
      }
    }
    return { ...z, x, z: zz, attackCd, hitFlash, rageT, phase, phaseT, abilityCd, atkAnim, chargeVx, chargeVz, chargeDmg }
  }
  if (phase === 'nova') {
    phaseT -= sdt
    if (phaseT <= 0) {
      phase = 'idle'
      abilityCd = 5 + Math.random() * 2
      const N = 14 + (rage - 1) * 2
      for (let k = 0; k < N; k++) {
        const a = (k / N) * Math.PI * 2
        useEntStore.getState().addProjectile(x, 2.2, zz, Math.sin(a) * 13, 0.3, Math.cos(a) * 13, 3.2, Math.round(z.dmg * 0.75))
      }
      fx.burst(x, 1.5, zz, '#aa22ff', 24)
      audio.tone(240, 0.5, 'sawtooth', 0.04, 90)
      playerRef.shake = Math.max(playerRef.shake, 0.4)
    }
    return { ...z, x, z: zz, attackCd, hitFlash, rageT, phase, phaseT, abilityCd, atkAnim, chargeVx, chargeVz, chargeDmg }
  }
  if (phase === 'volley') {
    phaseT -= sdt
    if (phaseT <= 0) {
      phase = 'idle'
      abilityCd = 4.5 + Math.random() * 2
      const N = 4 + rage
      const base = Math.atan2(dx, dz)
      for (let k = 0; k < N; k++) {
        const t = (N === 1 ? 0 : k / (N - 1)) - 0.5
        const a = base + t * 0.5
        useEntStore.getState().addProjectile(x, 2.2, zz, Math.sin(a) * 14, 1.1 * 14 * 0.08, Math.cos(a) * 14, 2.8, Math.round(z.dmg * 0.5))
      }
      fx.burst(x, 2.2, zz, '#ff4422', 12)
    }
    return { ...z, x, z: zz, attackCd, hitFlash, rageT, phase, phaseT, abilityCd, atkAnim, chargeVx, chargeVz, chargeDmg }
  }

  // idle: rage check (js/zombies.js:406)
  const frac = z.hp / z.maxHp
  const newRage = frac > 0.8 ? 1 : frac > 0.6 ? 2 : frac > 0.4 ? 3 : frac > 0.2 ? 4 : 5
  if (newRage !== rage) {
    rage = newRage
    fx.burst(x, 1.5, zz, '#cc66ff', 20)
    fx.showBanner(`BOSS MUTATION — ${BOSS_FORMS[rage - 1]}`)
    fx.caption(`👹 Boss mutates — ${BOSS_FORMS[rage - 1]}`)
    audio.tone(240, 0.5, 'sawtooth', 0.04, 90)
    playerRef.shake = Math.max(playerRef.shake, 0.4)
  }
  abilityCd -= sdt
  const sp = z.speed * (1 + (rage - 1) * 0.14)
  if (dist > 2.6) {
    x += (dx / dist) * sp * sdt
    zz += (dz / dist) * sp * sdt
  } else {
    attackCd -= sdt
    if (attackCd <= 0) {
      attackCd = 1.1 - (rage - 1) * 0.07
      atkAnim = 0.5
      if (useGameStore.getState().hurt(z.dmg, x, zz)) die('YOU DIED')
      playerRef.shake = Math.max(playerRef.shake, 0.3)
    }
  }
  if (abilityCd <= 0) {
    const opts = ['slam', 'summon']
    if (rage >= 2) opts.push('charge')
    if (rage >= 3) opts.push('nova')
    if (rage >= 4) opts.push('volley')
    const r = opts[Math.floor(Math.random() * opts.length)]
    if (r === 'charge') {
      phase = 'charge'
      phaseT = 0.9
      const v = Math.hypot(dx, dz) || 1
      chargeVx = (dx / v) * sp * (6 + rage)
      chargeVz = (dz / v) * sp * (6 + rage)
      chargeDmg = Math.round(z.dmg * (1.5 + rage * 0.3))
    } else if (r === 'slam') { phase = 'slam'; phaseT = 1.1 }
    else if (r === 'summon') { phase = 'summon'; phaseT = 1.2 }
    else if (r === 'nova') { phase = 'nova'; phaseT = 1.3 }
    else { phase = 'volley'; phaseT = 1.8 }
  }
  return { ...z, x, z: zz, attackCd, hitFlash, rage, rageT, phase, phaseT, abilityCd, atkAnim, chargeVx, chargeVz, chargeDmg }
}

function explode(x: number, z: number): void {
  const gx = useGameStore.getState()
  const dmg = 120 * gx.mult.damage
  useFxStore.getState().burst(x, 1, z, '#ff7722', 24)
  useFxStore.getState().caption('💥 Explosion nearby')
  audio.explosion()
  playerRef.shake = Math.max(playerRef.shake, 0.5)
  for (const zb of [...useZombieStore.getState().list]) {
    const d = Math.hypot(zb.x - x, zb.z - z)
    if (d < 7) {
      const updated = useZombieStore.getState().damage(zb.id, dmg * (1 - d / 14))
      if (!updated) {
        useGameStore.getState().addKill(10, 8, 12)
        useFxStore.getState().burst(zb.x, 1.1, zb.z, '#4a7a3a', 10)
        useFxStore.getState().pingKill()
      }
    }
  }
}
