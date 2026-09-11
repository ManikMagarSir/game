import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { playerRef } from '../store/playerRef'
import { useGameStore } from '../store/useGameStore'

// Camera-attached viewmodels, 8 variants (silhouettes echo js/models/weapon.js).
export const gunKick = { v: 0 }
export const muzzleFlash = { t: 0 }

const COLORS = [0x33363c, 0x3a4a5a, 0x5a4a3a, 0x5a6b3a, 0x4a5a4a, 0x2a2a3a, 0x6b4a2b, 0x8a2a2a]
const BARREL = [0.42, 0.6, 0.7, 0.62, 0.72, 0.95, 0.5, 0.45]

export default function WeaponViewModel(): React.JSX.Element {
  const g = useRef<THREE.Group>(null!)
  const flash = useRef<THREE.Mesh>(null!)
  const id = useGameStore((s) => s.curWeapon)
  const tmp = useMemo(
    () => ({ fwd: new THREE.Vector3(), right: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0), pos: new THREE.Vector3(), q: new THREE.Quaternion(), e: new THREE.Euler() }),
    [],
  )

  useFrame((state, dt) => {
    const cam = state.camera
    gunKick.v += (0 - gunKick.v) * Math.min(1, 10 * dt)
    muzzleFlash.t = Math.max(0, muzzleFlash.t - dt)
    if (playerRef.switchCd > 0) {
      const dip = Math.sin(Math.min(1, 1 - playerRef.switchCd / 0.35) * Math.PI)
      tmp.pos.y = -dip * 0.2
    }
    tmp.e.set(playerRef.pitch, playerRef.yaw, 0, 'YXZ')
    tmp.q.setFromEuler(tmp.e)
    tmp.fwd.set(0, 0, -1).applyQuaternion(tmp.q)
    tmp.right.crossVectors(tmp.fwd, tmp.up).normalize()
    tmp.pos.copy(cam.position).addScaledVector(tmp.fwd, 0.55).addScaledVector(tmp.right, 0.28)
    tmp.pos.y -= 0.24 - gunKick.v * 0.1
    tmp.pos.addScaledVector(tmp.fwd, gunKick.v * 0.15)
    g.current.position.copy(tmp.pos)
    g.current.quaternion.copy(tmp.q)
    if (flash.current) flash.current.visible = muzzleFlash.t > 0
  })

  const barrel = BARREL[id] ?? 0.42
  return (
    <group ref={g}>
      <mesh castShadow>
        <boxGeometry args={[0.09, 0.14, barrel]} />
        <meshLambertMaterial color={COLORS[id] ?? 0x33363c} />
      </mesh>
      <mesh position={[0, -0.14, 0.1]}>
        <boxGeometry args={[0.08, 0.18, 0.1]} />
        <meshLambertMaterial color={0x4a3420} />
      </mesh>
      {id === 5 && (
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[0.05, 0.08, 0.3]} />
          <meshLambertMaterial color={0x111111} />
        </mesh>
      )}
      <mesh ref={flash} position={[0, 0.02, -barrel / 2 - 0.1]}>
        <boxGeometry args={[0.16, 0.16, 0.16]} />
        <meshBasicMaterial color={0xffcc55} transparent opacity={0.9} />
      </mesh>
    </group>
  )
}
