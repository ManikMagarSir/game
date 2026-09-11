import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { WEAPONS } from '../game/config'
import { bulletDamage, computeSpread, isBossWave, meleeDamage, pelletsFor, pickSpawnType, pierceFor, spawnInterval, waveSize, xpForKill } from '../game/balance'
import { ZTYPES } from '../game/config'
import { playerRef } from '../store/playerRef'
import { useGameStore } from '../store/useGameStore'
import { useZombieStore } from '../store/useZombieStore'
import { useWorldStore } from '../store/useWorldStore'
import { useFxStore } from '../store/useFxStore'
import { useEntStore } from '../store/useEntStore'
import { sortHits, type Sphere } from '../systems/rays'
import { audio } from '../systems/audio'
import { useSettingsStore } from '../store/useSettingsStore'
import { moveState } from '../lib/binds'
import { gunKick, muzzleFlash } from './WeaponViewModel'

// Central tick: all 8 weapons, melee, grenades, waves, modes.
// Port of js/weapons.js:51 tryShoot + js/waves.js:22 updateWaves.
export default function GameLoop(): null {
  const prevFiring = useRef(false)
  const tmp = useRef({ dir: new THREE.Vector3(), fwd: new THREE.Vector3(), q: new THREE.Quaternion(), e: new THREE.Euler() })

  useFrame((state, rawDt) => {
    const gs = useGameStore.getState()
    if (gs.phase !== 'playing') {
      prevFiring.current = playerRef.firing
      return
    }
    const dt = Math.min(rawDt, 0.05)
    if (gs.hitStop > 0) useGameStore.setState({ hitStop: Math.max(0, gs.hitStop - rawDt) })
    const sdt = gs.hitStop > 0 ? dt * 0.15 : dt

    if (playerRef.weaponTimer > 0) playerRef.weaponTimer -= sdt
    if (playerRef.meleeCd > 0) playerRef.meleeCd -= sdt
    if (playerRef.switchCd > 0) playerRef.switchCd -= sdt
    useGameStore.getState().tickCombo(sdt)
    useFxStore.getState().tick(sdt)

    // Time attack (js/waves.js:23)
    const g0 = useGameStore.getState()
    if (g0.mode === 'time' && g0.timer > 0) {
      const t = g0.timer - sdt
      if (t <= 0) {
        useGameStore.setState({ timer: 0, overTitle: 'TIME UP!' })
        useGameStore.getState().setPhase('gameover')
        try { document.exitPointerLock() } catch { /* noop */ }
        return
      }
      useGameStore.setState({ timer: t })
    }

    // ---- waves (full pickSpawnType table) ----
    const g = useGameStore.getState()
    if (g.waveActive) {
      if (g.toSpawn > 0) {
        const st = g.spawnTimer - sdt
        if (st <= 0) {
          useZombieStore.getState().spawn(pickSpawnType(g.wave, g.mode), g.wave)
          useGameStore.setState({ toSpawn: g.toSpawn - 1, spawnTimer: spawnInterval(g.wave) })
        } else {
          useGameStore.setState({ spawnTimer: st })
        }
      } else if (useZombieStore.getState().list.length === 0) {
        useGameStore.setState({ waveActive: false, intermission: 4 })
        useFxStore.getState().showBanner('WAVE CLEARED')
        useFxStore.getState().caption('🔔 Wave cleared')
      }
    } else {
      const inter = g.intermission - sdt
      if (inter <= 0) {
        const wave = g.wave + 1
        const boss = isBossWave(wave, g.mode)
        if (boss) useZombieStore.getState().spawn('boss', wave)
        useGameStore.setState({ wave, waveActive: true, toSpawn: waveSize(wave, g.mode, boss), spawnTimer: 0 })
        useFxStore.getState().showBanner(boss ? `BOSS WAVE ${wave}` : `WAVE ${wave}`)
        useFxStore.getState().caption(boss ? `👹 Boss wave ${wave}` : `🌊 Wave ${wave}`)
        audio.wave()
      } else {
        useGameStore.setState({ intermission: inter })
      }
    }

    // ---- melee (F, shield-piercing, js/weapons.js:110) ----
    if (playerRef.meleeReq) {
      playerRef.meleeReq = false
      if (playerRef.meleeCd <= 0) {
        playerRef.meleeCd = 0.6
        const dmg = meleeDamage(g.mult)
        const cam = state.camera
        const fwd = tmp.current.fwd.set(0, 0, -1).applyQuaternion(cam.quaternion).setY(0).normalize()
        for (const z of [...useZombieStore.getState().list]) {
          const dx = z.x - playerRef.x, dz = z.z - playerRef.z
          if (Math.hypot(dx, dz) > 3.0) continue
          const dot = (dx * fwd.x + dz * fwd.z) / (Math.hypot(dx, dz) || 1)
          if (dot > 0.5) hitZombie(z.id, dmg, false, true)
        }
        playerRef.shake = Math.max(playerRef.shake, 0.18)
        audio.melee()
      }
    }

    // ---- grenade (G, js/weapons.js:128) ----
    if (playerRef.grenadeReq) {
      playerRef.grenadeReq = false
      const gg = useGameStore.getState()
      if (gg.grenades > 0 || gg.god) {
        if (!gg.god) useGameStore.setState({ grenades: gg.grenades - 1 })
        const cam = state.camera
        const fwd = tmp.current.fwd.set(0, 0, -1).applyQuaternion(cam.quaternion).setY(0).normalize()
        useEntStore.getState().throwGrenade(playerRef.x, 1.5, playerRef.z, fwd.x, fwd.z)
      }
    }

    // ---- shooting (all 8, auto vs semi) ----
    const w = WEAPONS[useGameStore.getState().curWeapon] ?? WEAPONS[0]
    const wantFire = w.auto ? playerRef.firing : playerRef.firing && !prevFiring.current
    prevFiring.current = playerRef.firing
    if (wantFire && playerRef.weaponTimer <= 0 && playerRef.switchCd <= 0) {
      playerRef.weaponTimer = w.cd * g.mult.fireRate
      const cam = state.camera
      tmp.current.e.set(playerRef.pitch, playerRef.yaw, 0, 'YXZ')
      tmp.current.q.setFromEuler(tmp.current.e)
      tmp.current.fwd.set(0, 0, -1).applyQuaternion(tmp.current.q)
      const ox = cam.position.x, oy = cam.position.y, oz = cam.position.z
      const keys = playerRef.keys
      const mv = moveState(keys, useSettingsStore.getState().binds)
      const moving = mv.f || mv.bk || mv.l || mv.r
      const sprinting = mv.sprint
      const spread = computeSpread(w, { aiming: playerRef.aiming, moving, sprinting, recoilP: playerRef.recoilP })
      const pellets = pelletsFor(w, g.mult)
      const pierce = pierceFor(g.mult)
      audio.shoot(w.sfx)
      let hitCount = 0, headCount = 0

      for (let p = 0; p < pellets; p++) {
        const d = tmp.current.dir.copy(tmp.current.fwd)
        if (spread > 0) {
          d.x += (Math.random() - 0.5) * spread
          d.y += (Math.random() - 0.5) * spread
          d.z += (Math.random() - 0.5) * spread
          d.normalize()
        }
        const spheres: Sphere[] = []
        for (const z of useZombieStore.getState().list) {
          if (z.kind === 'boss') {
            const s = 2.2 + (z.rage - 1) * 0.15
            spheres.push({ x: z.x, y: 1.8 * s, z: z.z, r: 1.1 * s, id: z.id, head: false })
            spheres.push({ x: z.x, y: 2.4 * s, z: z.z, r: 0.9 * s, id: z.id, head: false })
            spheres.push({ x: z.x, y: 2.9 * s, z: z.z, r: 0.6 * s, id: z.id, head: true })
            continue
          }
          const s = z.kind === 'brute' ? 1.7 : z.kind === 'runner' ? 0.85 : z.kind === 'shield' ? 1.5 : 1
          spheres.push({ x: z.x, y: 1.2 * s, z: z.z, r: 0.75 * s, id: z.id, head: false })
          spheres.push({ x: z.x, y: 1.85 * s, z: z.z, r: 0.38 * s, id: z.id, head: true })
        }
        useWorldStore.getState().layout.crates.forEach((c, i) => spheres.push({ x: c.x, y: c.h / 2, z: c.z, r: Math.max(c.s * 0.7, 0.6), id: -(i + 1), head: false }))
        const hits = sortHits(ox, oy, oz, d.x, d.y, d.z, spheres, w.range)
        let end: [number, number, number] = [ox + d.x * w.range, oy + d.y * w.range, oz + d.z * w.range]
        let pierced = 0
        const seen = new Set<number>()
        for (const h of hits) {
          end = [ox + d.x * h.dist, oy + d.y * h.dist, oz + d.z * h.dist]
          if (h.s.id < 0) {
            const idx = -h.s.id - 1
            const destroyed = useWorldStore.getState().damageCrate(idx, w.dmg * g.mult.damage)
            useFxStore.getState().burst(end[0], 1, end[2], '#6b4a2b', destroyed ? 12 : 4)
            break
          }
          if (seen.has(h.s.id)) continue
          seen.add(h.s.id)
          const z = useZombieStore.getState().list.find((zz) => zz.id === h.s.id)
          if (!z) continue
          hitZombie(z.id, bulletDamage(w, g.mult, h.s.head), h.s.head, false)
          hitCount++
          if (h.s.head) headCount++
          pierced++
          if (pierced >= pierce) break
        }
        useFxStore.getState().addTracer([ox + tmp.current.fwd.x, oy - 0.1, oz + tmp.current.fwd.z], end)
      }
      useGameStore.getState().recordShots(pellets, hitCount, headCount)
      playerRef.recoilP += w.recoil * (playerRef.aiming ? 0.5 : 1) * (g.attach.sup ? 0.6 : 1)
      playerRef.recoilY += (Math.random() - 0.5) * w.recoil * (g.attach.sup ? 0.6 : 1)
      gunKick.v = Math.min(0.5, gunKick.v + w.recoil * 1.2)
      muzzleFlash.t = 0.05
    }
  })
  return null
}

function hitZombie(id: number, dmg: number, isHead: boolean, shieldPierce: boolean): void {
  const z = useZombieStore.getState().list.find((zz) => zz.id === id)
  if (!z) return
  // Shield frontal block (js/zombies.js:66) — melee/grenade pierce
  if (z.shieldHp > 0 && !shieldPierce) {
    const hp = z.shieldHp - dmg
    useZombieStore.setState((s) => ({ list: s.list.map((zz) => (zz.id === id ? { ...zz, shieldHp: hp, hitFlash: 0.08 } : zz)) }))
    useFxStore.getState().burst(z.x, 1.4, z.z, '#8899aa', 4)
    if (hp <= 0) audio.tone(300, 0.3, 'sawtooth', 0.07, 120)
    return
  }
  const updated = useZombieStore.getState().damage(id, dmg)
  useFxStore.getState().pingHit(isHead)
  useFxStore.getState().burst(z.x, isHead ? 1.8 : 1.2, z.z, isHead ? '#ffcc44' : '#882222', isHead ? 8 : 5)
  if (isHead) audio.headshot()
  else audio.hit()
  if (!updated) {
    const t = ZTYPES[z.kind]
    const g = useGameStore.getState()
    const isBoss = z.kind === 'boss'
    g.addKill(t.score, t.cash, xpForKill(g.wave, z.maxHp, false) * (isBoss ? 4 : 1))
    useFxStore.getState().pingKill()
    audio.tone(1200, 0.07, 'square', 0.035, 1800)
    if (isBoss) {
      useFxStore.getState().showBanner('BOSS DOWN')
      useFxStore.getState().caption('👹 Boss defeated')
      useEntStore.getState().spawnPickup(z.x, z.z, 'grenade')
    }
    if (g.mult.lifesteal > 0) g.heal(g.mult.lifesteal)
    useFxStore.getState().burst(z.x, 1.1, z.z, '#4a7a3a', 10)
    audio.zombieDie()
    const r = Math.random()
    if (r < 0.12) useEntStore.getState().spawnPickup(z.x, z.z, 'health')
    else if (r < 0.22) useEntStore.getState().spawnPickup(z.x, z.z, 'grenade')
  }
}
