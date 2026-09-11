import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { playerRef } from '../store/playerRef'
import { useGameStore } from '../store/useGameStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useWorldStore } from '../store/useWorldStore'
import { ARENA_CLAMP, BASE_SPEED, SPRINT_SPEED, AIM_MULT, PLAYER_Y } from '../game/constants'
import { clamp } from '../lib/math'
import { moveState } from '../lib/binds'
import { prefersReducedMotion } from '../lib/a11y'
import { collideCircle } from '../three/worldData'

// Port of js/main.js:150 updatePlayer — runs in useFrame, zero React state writes.
export default function PlayerController(): null {
  const tmp = useMemo(() => ({ fwd: new THREE.Vector3(), right: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0) }), [])

  const first = useRef(true)
  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05)
    if (useGameStore.getState().phase !== 'playing') return
    const cam = state.camera as THREE.PerspectiveCamera

    // Init camera rotation order once (legacy js/world.js:14 YXZ)
    if (first.current) {
      cam.rotation.order = 'YXZ'
      first.current = false
    }

    const keys = playerRef.keys
    const mv = moveState(keys, useSettingsStore.getState().binds)
    // Forward from yaw (flat)
    tmp.fwd.set(-Math.sin(playerRef.yaw), 0, -Math.cos(playerRef.yaw))
    tmp.right.crossVectors(tmp.fwd, tmp.up).normalize()

    let mx = 0, mz = 0
    if (mv.f) { mx += tmp.fwd.x; mz += tmp.fwd.z }
    if (mv.bk) { mx -= tmp.fwd.x; mz -= tmp.fwd.z }
    if (mv.r) { mx += tmp.right.x; mz += tmp.right.z }
    if (mv.l) { mx -= tmp.right.x; mz -= tmp.right.z }
    const moving = mx !== 0 || mz !== 0
    if (moving) {
      const len = Math.hypot(mx, mz)
      mx /= len; mz /= len
      let sp = mv.sprint ? SPRINT_SPEED : BASE_SPEED
      if (playerRef.aiming) sp *= AIM_MULT
      playerRef.x = clamp(playerRef.x + mx * sp * dt, -ARENA_CLAMP, ARENA_CLAMP)
      playerRef.z = clamp(playerRef.z + mz * sp * dt, -ARENA_CLAMP, ARENA_CLAMP)
    }

    // Collide vs live crates (circle push-out)
    const crates = useWorldStore.getState().layout.crates
    const res = collideCircle(playerRef.x, playerRef.z, 0.4, crates)
    playerRef.x = res.x
    playerRef.z = res.z

    // Recoil decay (legacy lerp 9/s approx)
    playerRef.recoilP += (0 - playerRef.recoilP) * Math.min(1, 9 * dt)
    playerRef.recoilY += (0 - playerRef.recoilY) * Math.min(1, 9 * dt)
    if (playerRef.shake > 0) playerRef.shake = Math.max(0, playerRef.shake - dt * 2.5)

    const sy = prefersReducedMotion() ? 0 : playerRef.shake
    cam.position.set(
      playerRef.x + (sy > 0 ? (Math.random() - 0.5) * sy : 0),
      PLAYER_Y + (sy > 0 ? (Math.random() - 0.5) * sy : 0),
      playerRef.z,
    )
    cam.rotation.set(playerRef.pitch + playerRef.recoilP, playerRef.yaw + playerRef.recoilY, 0)

    // Aim FOV (legacy js/input.js:37 + scope attach)
    const g = useGameStore.getState()
    const baseFov = useSettingsStore.getState().fov
    const targetFov = playerRef.aiming ? (g.curWeapon === 5 ? 25 : g.attach.scope ? 38 : 55) : baseFov
    if (Math.abs(cam.fov - targetFov) > 0.5) {
      cam.fov += (targetFov - cam.fov) * Math.min(1, 12 * dt)
      cam.updateProjectionMatrix()
    }
  })
  return null
}
