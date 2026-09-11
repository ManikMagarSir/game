import { useEffect, useRef } from 'react'
import { playerRef } from '../store/playerRef'
import { useGameStore } from '../store/useGameStore'
import { useZombieStore } from '../store/useZombieStore'
import { GROUND_SIZE } from '../game/constants'

// Circular 2D minimap — player arrow + zombies + beacon. Reads transient state at ~12Hz.
export default function Minimap(): React.JSX.Element {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    const id = setInterval(() => {
      if (useGameStore.getState().phase === 'lobby') return
      const S = cv.width
      const R = S / 2
      const scale = R / (GROUND_SIZE / 2)
      ctx.clearRect(0, 0, S, S)
      ctx.fillStyle = 'rgba(10,15,22,0.75)'
      ctx.beginPath()
      ctx.arc(R, R, R - 1, 0, Math.PI * 2)
      ctx.fill()
      const dot = (x: number, z: number, c: string, r: number) => {
        ctx.fillStyle = c
        ctx.beginPath()
        ctx.arc(R + x * scale, R + z * scale, r, 0, Math.PI * 2)
        ctx.fill()
      }
      if (useGameStore.getState().mode === 'defense') dot(0, -20, '#66ccff', 4)
      for (const z of useZombieStore.getState().list) {
        dot(z.x, z.z, z.kind === 'boss' ? '#ff2244' : '#ff6655', z.kind === 'boss' ? 4 : 2)
      }
      // player arrow
      ctx.save()
      ctx.translate(R + playerRef.x * scale, R + playerRef.z * scale)
      ctx.rotate(-playerRef.yaw)
      ctx.fillStyle = '#4de7ff'
      ctx.beginPath()
      ctx.moveTo(0, -6)
      ctx.lineTo(4, 5)
      ctx.lineTo(-4, 5)
      ctx.closePath()
      ctx.fill()
      ctx.restore()
    }, 80)
    return () => clearInterval(id)
  }, [])

  return (
    <canvas
      ref={ref}
      width={148}
      height={148}
      className="pointer-events-none absolute bottom-4 right-4 rounded-full shadow-raised-sm"
    />
  )
}
