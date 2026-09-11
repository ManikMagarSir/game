import { useFxStore } from '../store/useFxStore'

// Pooled FX render: tracers as lines, particles as instanced boxes.
export default function Effects(): React.JSX.Element {
  const tracers = useFxStore((s) => s.tracers)
  const particles = useFxStore((s) => s.particles)

  return (
    <group>
      {tracers.map((t) => (
        <lineSegments key={t.id}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[new Float32Array([t.ax, t.ay, t.az, t.bx, t.by, t.bz]), 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={0xffdd55} transparent opacity={0.9} />
        </lineSegments>
      ))}
      {particles.map((p) => (
        <mesh key={p.id} position={[p.x, p.y, p.z]}>
          <boxGeometry args={[0.14, 0.14, 0.14]} />
          <meshBasicMaterial color={p.color} />
        </mesh>
      ))}
    </group>
  )
}
