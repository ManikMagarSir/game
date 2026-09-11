import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useSettingsStore } from '../../store/useSettingsStore'
import { cb } from '../../lib/colorblind'

// 5 boss forms — silhouettes echo js/models/boss.js:19 (abomination/titan/oculus/reaper/colossus).
const FORMS = [
  { name: 'ABOMINATION', skin: 0x7a2a9a, cloth: 0x1f1524, core: 0xaa22ff, scale: 2.2, horns: true },
  { name: 'TITAN', skin: 0x8a2a22, cloth: 0x221512, core: 0xff4400, scale: 2.4, horns: true },
  { name: 'OCULUS', skin: 0x5a2a7a, cloth: 0x1a1020, core: 0xbb55ff, scale: 2.1, horns: false },
  { name: 'REAPER', skin: 0x2a2a3a, cloth: 0x101018, core: 0x66aaff, scale: 2.25, horns: false },
  { name: 'COLOSSUS', skin: 0x9a2a2a, cloth: 0x1a0f0f, core: 0xff2200, scale: 2.9, horns: true },
]

export const BOSS_FORMS = FORMS.map((f) => f.name)

export default function BossModel({ rage, hitFlash, rageT }: { rage: number; hitFlash: number; rageT: number }): React.JSX.Element {
  const f = FORMS[Math.min(5, Math.max(1, rage)) - 1]
  const walk = useRef(0)
  const armL = useRef<THREE.Mesh>(null!)
  const armR = useRef<THREE.Mesh>(null!)
  const colorblind = useSettingsStore((s) => s.colorblind)
  const mats = useMemo(
    () => ({
      skin: new THREE.MeshLambertMaterial({ color: f.skin }),
      cloth: new THREE.MeshLambertMaterial({ color: f.cloth }),
      eye: new THREE.MeshLambertMaterial({ color: 0x0a000a, emissive: cb.eye(colorblind), emissiveIntensity: 1.4 }),
      core: new THREE.MeshLambertMaterial({ color: 0x220022, emissive: f.core, emissiveIntensity: 1 }),
      bone: new THREE.MeshLambertMaterial({ color: 0xffffff }),
    }),
    [f.skin, f.cloth, f.core, colorblind],
  )

  useFrame((_, dt) => {
    walk.current += dt * 4
    const s = Math.sin(walk.current) * 0.55
    if (armL.current) armL.current.rotation.x = s
    if (armR.current) armR.current.rotation.x = -s
    const e = hitFlash > 0 ? cb.hitFlash(useSettingsStore.getState().colorblind) : 0x000000
    mats.skin.emissive.setHex(e)
    mats.cloth.emissive.setHex(e)
  })

  const aura = rage === 5 ? 0.14 + Math.abs(Math.sin(rageT * 3)) * 0.2 : 0

  return (
    <group scale={f.scale}>
      <mesh material={mats.cloth} position={[0, 1.7, 0]}>
        <boxGeometry args={[1.6, 1.7, 1.0]} />
      </mesh>
      <mesh material={mats.skin} position={[0, 1.85, 0]}>
        <boxGeometry args={[1.15, 1.0, 1.1]} />
      </mesh>
      <mesh material={mats.skin} position={[0, 2.85, 0]}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
      </mesh>
      <mesh material={mats.eye} position={[-0.24, 3.0, 0.42]}>
        <boxGeometry args={[0.22, 0.22, 0.12]} />
      </mesh>
      <mesh material={mats.eye} position={[0.24, 3.0, 0.42]}>
        <boxGeometry args={[0.22, 0.22, 0.12]} />
      </mesh>
      {f.horns && (
        <>
          <mesh material={mats.bone} position={[-0.42, 3.6, 0.1]} rotation={[0, 0, 0.5]}>
            <boxGeometry args={[0.2, 0.9, 0.2]} />
          </mesh>
          <mesh material={mats.bone} position={[0.42, 3.6, 0.1]} rotation={[0, 0, -0.5]}>
            <boxGeometry args={[0.2, 0.9, 0.2]} />
          </mesh>
        </>
      )}
      <mesh material={mats.core} position={[0, 1.9, 0.6]}>
        <boxGeometry args={[0.4, 0.4, 0.32]} />
      </mesh>
      <mesh ref={armL} material={mats.cloth} position={[-1.15, 2.0, 0]}>
        <boxGeometry args={[0.5, 1.6, 0.5]} />
      </mesh>
      <mesh ref={armR} material={mats.cloth} position={[1.15, 2.0, 0]}>
        <boxGeometry args={[0.5, 1.6, 0.5]} />
      </mesh>
      <mesh material={mats.cloth} position={[-0.5, 0.7, 0]}>
        <boxGeometry args={[0.55, 1.4, 0.55]} />
      </mesh>
      <mesh material={mats.cloth} position={[0.5, 0.7, 0]}>
        <boxGeometry args={[0.55, 1.4, 0.55]} />
      </mesh>
      {rage === 5 && (
        <mesh position={[0, 2.6, 0]}>
          <boxGeometry args={[3.2, 7.4, 2.8]} />
          <meshLambertMaterial color={0xff0000} emissive={0xff2200} transparent opacity={aura} depthWrite={false} />
        </mesh>
      )}
    </group>
  )
}
