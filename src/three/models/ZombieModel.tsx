import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { ZombieKind } from '../../game/types'
import { useSettingsStore } from '../../store/useSettingsStore'
import { cb } from '../../lib/colorblind'

// Voxel zombie rig. Port of js/models/zombie.js:8 (normal + variants).
export default function ZombieModel({ kind, hitFlash }: { kind: ZombieKind; hitFlash: number }) {
  const walk = useRef(Math.random() * Math.PI * 2)
  const armL = useRef<THREE.Mesh>(null!)
  const armR = useRef<THREE.Mesh>(null!)
  const legL = useRef<THREE.Mesh>(null!)
  const legR = useRef<THREE.Mesh>(null!)
  const crawler = kind === 'crawler'
  const colorblind = useSettingsStore((s) => s.colorblind)
  const mats = useMemo(() => {
    const color = kind === 'runner' ? 0xb6a23a : kind === 'brute' ? 0x7a2a2a : kind === 'spitter' ? 0x3a9a5a : kind === 'exploder' ? 0x9a4a2a : kind === 'screamer' ? 0x7a5a9a : kind === 'shield' ? 0x5a6a7a : kind === 'boss' ? 0x7a2a9a : 0x4a7a3a
    return {
      skin: new THREE.MeshLambertMaterial({ color }),
      cloth: new THREE.MeshLambertMaterial({ color: 0x2e2a28 }),
      eye: new THREE.MeshLambertMaterial({ color: 0x111111, emissive: cb.eye(colorblind), emissiveIntensity: 0.9 }),
      metal: new THREE.MeshLambertMaterial({ color: 0x4a3a2a }),
      core: new THREE.MeshLambertMaterial({ color: 0x332200, emissive: 0xff7722, emissiveIntensity: 1 }),
      sac: new THREE.MeshLambertMaterial({ color: 0x2a5a2a, emissive: 0x1a7a3a, emissiveIntensity: 0.55 }),
    }
  }, [kind, colorblind])

  useFrame((_, dt) => {
    walk.current += dt * (crawler ? 9 : 6)
    const s = Math.sin(walk.current) * (crawler ? 0.5 : 0.7)
    if (armL.current) armL.current.rotation.x = (crawler ? -0.8 : 0) + s
    if (armR.current) armR.current.rotation.x = (crawler ? -0.8 : 0) - s
    if (legL.current) legL.current.rotation.x = (crawler ? 1.0 : 0) - s
    if (legR.current) legR.current.rotation.x = (crawler ? 1.0 : 0) + s
  })

  useFrame(() => {
    const e = hitFlash > 0 ? cb.hitFlash(useSettingsStore.getState().colorblind) : 0x000000
    mats.skin.emissive.setHex(e)
    mats.cloth.emissive.setHex(e)
  })

  if (crawler) {
    return (
      <group>
        <mesh material={mats.skin} position={[0, 0.3, 0]}>
          <boxGeometry args={[0.72, 0.32, 1.0]} />
        </mesh>
        <mesh material={mats.skin} position={[0, 0.42, 0.6]}>
          <boxGeometry args={[0.4, 0.3, 0.42]} />
        </mesh>
        <mesh ref={armL} material={mats.skin} position={[-0.46, 0.32, 0.5]}>
          <boxGeometry args={[0.12, 0.4, 0.12]} />
        </mesh>
        <mesh ref={armR} material={mats.skin} position={[0.46, 0.32, 0.5]}>
          <boxGeometry args={[0.12, 0.4, 0.12]} />
        </mesh>
        <mesh ref={legL} material={mats.skin} position={[-0.46, 0.32, -0.5]}>
          <boxGeometry args={[0.14, 0.45, 0.14]} />
        </mesh>
        <mesh ref={legR} material={mats.skin} position={[0.46, 0.32, -0.5]}>
          <boxGeometry args={[0.14, 0.45, 0.14]} />
        </mesh>
      </group>
    )
  }

  const scale = kind === 'brute' ? 1.7 : kind === 'runner' ? 0.85 : kind === 'shield' ? 1.5 : kind === 'screamer' ? 1.1 : 1
  return (
    <group scale={scale}>
      <mesh material={mats.cloth} position={[0, 1.05, 0]}>
        <boxGeometry args={[0.95, 1.05, 0.55]} />
      </mesh>
      <mesh material={mats.skin} position={[0, 1.85, 0]}>
        <boxGeometry args={[0.55, 0.55, 0.55]} />
      </mesh>
      <mesh material={mats.eye} position={[-0.15, 1.93, 0.29]}>
        <boxGeometry args={[0.14, 0.14, 0.08]} />
      </mesh>
      <mesh material={mats.eye} position={[0.15, 1.93, 0.29]}>
        <boxGeometry args={[0.14, 0.14, 0.08]} />
      </mesh>
      {kind === 'shield' && (
        <mesh material={mats.metal} position={[0, 1.25, 0.55]}>
          <boxGeometry args={[1.1, 1.5, 0.14]} />
        </mesh>
      )}
      {kind === 'exploder' && (
        <mesh material={mats.core} position={[0, 1.15, 0.35]}>
          <boxGeometry args={[0.28, 0.28, 0.24]} />
        </mesh>
      )}
      {kind === 'spitter' && (
        <mesh material={mats.sac} position={[0, 1.0, -0.5]}>
          <boxGeometry args={[0.5, 0.42, 0.42]} />
        </mesh>
      )}
      <mesh ref={armL} material={mats.cloth} position={[-0.6, 1.2, 0]}>
        <boxGeometry args={[0.26, 1.1, 0.26]} />
      </mesh>
      <mesh ref={armR} material={mats.cloth} position={[0.6, 1.2, 0]}>
        <boxGeometry args={[0.26, 1.1, 0.26]} />
      </mesh>
      <mesh ref={legL} material={mats.cloth} position={[-0.24, 0.45, 0]}>
        <boxGeometry args={[0.3, 0.9, 0.3]} />
      </mesh>
      <mesh ref={legR} material={mats.cloth} position={[0.24, 0.45, 0]}>
        <boxGeometry args={[0.3, 0.9, 0.3]} />
      </mesh>
    </group>
  )
}
