import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { GROUND_SIZE, TILE } from '../game/constants'
import { useWorldStore } from '../store/useWorldStore'
import { useGameStore } from '../store/useGameStore'
import { crateMat, groundMatA, groundMatB, leafMat, rockMat, trunkMat } from '../three/materials'
import { tileBox, unitBox } from '../three/materials'

// Instanced world — fixes js/world.js:81 3600 draw calls → 2 ground + 1 crate + trunks/leaves/rocks.
export default function World(): React.JSX.Element {
  const crates = useWorldStore((s) => s.layout.crates)
  const trees = useWorldStore((s) => s.layout.trees)
  const rocks = useWorldStore((s) => s.layout.rocks)
  const defense = useGameStore((s) => s.mode === 'defense' && s.phase !== 'lobby')

  const n = GROUND_SIZE / TILE // 60
  const { matA, matB } = useMemo(() => {
    const a = new THREE.Matrix4()
    const listA: THREE.Matrix4[] = []
    const listB: THREE.Matrix4[] = []
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        a.makeTranslation(-GROUND_SIZE / 2 + i * TILE + TILE / 2, -0.5, -GROUND_SIZE / 2 + j * TILE + TILE / 2)
        if ((i + j) % 2 === 0) listA.push(a.clone())
        else listB.push(a.clone())
      }
    return { matA: listA, matB: listB }
  }, [n])

  const groundARef = useRef<THREE.InstancedMesh>(null!)
  const groundBRef = useRef<THREE.InstancedMesh>(null!)
  const crateRef = useRef<THREE.InstancedMesh>(null!)

  useLayoutEffect(() => {
    matA.forEach((m, i) => groundARef.current.setMatrixAt(i, m))
    groundARef.current.instanceMatrix.needsUpdate = true
    matB.forEach((m, i) => groundBRef.current.setMatrixAt(i, m))
    groundBRef.current.instanceMatrix.needsUpdate = true
  }, [matA, matB])

  // Crates: rebuild matrices on damage/layout change (≤80, cheap)
  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    const pos = new THREE.Vector3()
    const scl = new THREE.Vector3()
    const col = new THREE.Color()
    crates.forEach((c, i) => {
      e.set(0, c.ry, 0)
      q.setFromEuler(e)
      pos.set(c.x, c.h / 2, c.z)
      scl.set(c.s, c.h, c.s)
      m.compose(pos, q, scl)
      crateRef.current.setMatrixAt(i, m)
      crateRef.current.setColorAt(i, col.set(c.tint ? 0x8899aa : 0xffffff))
    })
    crateRef.current.count = crates.length
    crateRef.current.instanceMatrix.needsUpdate = true
    if (crateRef.current.instanceColor) crateRef.current.instanceColor.needsUpdate = true
  }, [crates])

  return (
    <group>
      <instancedMesh ref={groundARef} args={[tileBox, groundMatA(), matA.length]} receiveShadow frustumCulled={false} />
      <instancedMesh ref={groundBRef} args={[tileBox, groundMatB(), matB.length]} receiveShadow frustumCulled={false} />
      <instancedMesh ref={crateRef} args={[unitBox, crateMat(), Math.max(1, crates.length)]} castShadow receiveShadow frustumCulled={false} />

      {/* Trees: 14 trunks + 42 leaves as individual voxel boxes (56 draws, instanced in polish) */}
      {trees.map((t, i) => (
        <group key={`tree-${i}`} position={[t.x, 0, t.z]}>
          <mesh material={trunkMat()} position={[0, 1.2, 0]} castShadow>
            <boxGeometry args={[0.6, 2.4, 0.6]} />
          </mesh>
          {[0, 1, 2].map((l) => {
            const s = 2.2 - l * 0.5
            return (
              <mesh key={l} material={leafMat()} position={[0, 2.6 + l * 0.9, 0]} castShadow>
                <boxGeometry args={[s, s, s]} />
              </mesh>
            )
          })}
        </group>
      ))}

      {rocks.map((r, i) => (
        <mesh key={`rock-${i}`} material={rockMat()} position={[r.x, r.s * 0.35, r.z]} rotation={[0, r.ry, 0]} castShadow receiveShadow>
          <boxGeometry args={[r.s, r.s * 0.7, r.s]} />
        </mesh>
      ))}

      {/* Beacon placeholder (Defense mode) */}
      <group position={[0, 0, -20]} visible={defense}>
        <mesh position={[0, 0.25, 0]} receiveShadow>
          <boxGeometry args={[2.4, 0.5, 2.4]} />
          <meshLambertMaterial color={0x445566} />
        </mesh>
        <mesh position={[0, 1.3, 0]}>
          <boxGeometry args={[1.2, 1.6, 1.2]} />
          <meshLambertMaterial color={0x66ccff} emissive={0x2266ff} />
        </mesh>
      </group>
    </group>
  )
}
