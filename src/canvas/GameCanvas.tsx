import { useState } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import World from './World'
import PlayerController from './PlayerController'
import Zombies from './Zombies'
import WeaponViewModel from './WeaponViewModel'
import Effects from './Effects'
import GameLoop from './GameLoop'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { useInput } from '../hooks/useInput'
import { usePointerLock } from '../hooks/usePointerLock'
import { gfxConfig, useSettingsStore } from '../store/useSettingsStore'
import { useGameStore } from '../store/useGameStore'

function InputWiring({ canvas }: { canvas: HTMLCanvasElement | null }): null {
  useInput()
  const { lock } = usePointerLock(canvas)
  void lock
  return null
}

export default function GameCanvas() {
  const gfx = useSettingsStore((s) => s.gfx)
  const cfg = gfxConfig(gfx)
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null)
  const phase = useGameStore((s) => s.phase)

  return (
    <div className="absolute inset-0" role="application" aria-label="Voxel Survivor 3D viewport. Use WASD to move, mouse to look, click to shoot.">
      <Canvas
        shadows={cfg.shadows ? 'percentage' : false}
        dpr={cfg.dpr}
        camera={{ fov: 75, near: 0.1, far: 600, position: [0, 1.7, 0] }}
        gl={{ antialias: true }}
        onCreated={(s) => {
          s.gl.shadowMap.enabled = cfg.shadows
          s.gl.shadowMap.type = THREE.PCFShadowMap
          setCanvasEl(s.gl.domElement)
        }}
      >
        <color attach="background" args={['#121a22']} />
        <fog attach="fog" args={['#121a22', cfg.fogNear, cfg.fogFar]} />
        <ambientLight color={0x556070} intensity={0.65} />
        <hemisphereLight color={0x6688aa} groundColor={0x223322} intensity={0.5} />
        <directionalLight
          position={[50, 90, 35]}
          color={0xfff0dd}
          intensity={0.95}
          castShadow={cfg.shadows}
          shadow-mapSize={[cfg.shadowSize, cfg.shadowSize]}
          shadow-camera-left={-80}
          shadow-camera-right={80}
          shadow-camera-top={80}
          shadow-camera-bottom={-80}
          shadow-camera-near={1}
          shadow-camera-far={260}
          shadow-bias={-0.0004}
        />
        <World />
        <Zombies />
        <WeaponViewModel />
        <Effects />
        <PlayerController />
        <GameLoop />
        {gfx !== 'low' && (
          <EffectComposer multisampling={0}>
            <Bloom intensity={0.55} luminanceThreshold={0.75} luminanceSmoothing={0.2} mipmapBlur />
            <Vignette eskil={false} offset={0.25} darkness={0.65} />
          </EffectComposer>
        )}
      </Canvas>
      <InputWiring canvas={canvasEl} />
      {phase !== 'playing' && (
        <div className="pointer-events-none absolute bottom-4 left-4 text-xs text-dim">
          WASD move · Shift sprint · Click canvas to lock · RMB aim
        </div>
      )}
    </div>
  )
}
