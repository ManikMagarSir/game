import { useRef, useState } from 'react'
import { playerRef } from '../store/playerRef'
import { useGameStore } from '../store/useGameStore'
import { useSettingsStore } from '../store/useSettingsStore'

// Touch fallback: left stick move, right-half drag look, FIRE/AIM/WPN/F/G buttons.
// Rendered only on touch devices while playing.
export default function TouchControls(): React.JSX.Element | null {
  const [touch] = useState(() => typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0))
  const phase = useGameStore((s) => s.phase)
  const stick = useRef<{ id: number; cx: number; cy: number; dx: number; dy: number } | null>(null)
  const look = useRef<{ id: number; x: number; y: number } | null>(null)
  const [, force] = useState(0)

  if (!touch || phase !== 'playing') return null

  const setMove = (dx: number, dy: number) => {
    const binds = useSettingsStore.getState().binds
    playerRef.keys[binds.forward] = dy < -0.25
    playerRef.keys[binds.back] = dy > 0.25
    playerRef.keys[binds.left] = dx < -0.25
    playerRef.keys[binds.right] = dx > 0.25
  }

  return (
    <div className="absolute inset-0 z-10 select-none" style={{ touchAction: 'none' }}>
      {/* left stick */}
      <div
        className="absolute bottom-24 left-6 h-32 w-32 rounded-full bg-white/10"
        onTouchStart={(e) => {
          const t = e.changedTouches[0]
          stick.current = { id: t.identifier, cx: t.clientX, cy: t.clientY, dx: 0, dy: 0 }
        }}
        onTouchMove={(e) => {
          const s = stick.current
          if (!s) return
          for (const t of Array.from(e.changedTouches)) {
            if (t.identifier !== s.id) continue
            s.dx = Math.max(-1, Math.min(1, (t.clientX - s.cx) / 48))
            s.dy = Math.max(-1, Math.min(1, (t.clientY - s.cy) / 48))
            setMove(s.dx, s.dy)
            force((n) => n + 1)
          }
        }}
        onTouchEnd={(e) => {
          const s = stick.current
          if (!s) return
          for (const t of Array.from(e.changedTouches)) {
            if (t.identifier === s.id) {
              stick.current = null
              setMove(0, 0)
            }
          }
        }}
      >
        <div
          className="absolute h-14 w-14 rounded-full bg-white/25"
          style={{
            left: 64 + (stick.current?.dx ?? 0) * 40 - 28,
            top: 64 + (stick.current?.dy ?? 0) * 40 - 28,
          }}
        />
      </div>
      {/* right-half look */}
      <div
        className="absolute inset-y-0 right-0 w-1/2"
        onTouchStart={(e) => {
          const t = e.changedTouches[0]
          look.current = { id: t.identifier, x: t.clientX, y: t.clientY }
        }}
        onTouchMove={(e) => {
          const l = look.current
          if (!l) return
          const { sensitivity, invertY } = useSettingsStore.getState()
          for (const t of Array.from(e.changedTouches)) {
            if (t.identifier !== l.id) continue
            const dx = t.clientX - l.x, dy = t.clientY - l.y
            l.x = t.clientX
            l.y = t.clientY
            playerRef.yaw -= dx * 0.0042 * sensitivity
            playerRef.pitch = Math.max(-1.45, Math.min(1.45, playerRef.pitch - (invertY ? -dy : dy) * 0.0042 * sensitivity))
          }
        }}
        onTouchEnd={(e) => {
          const l = look.current
          if (!l) return
          for (const t of Array.from(e.changedTouches)) {
            if (t.identifier === l.id) look.current = null
          }
        }}
      />
      {/* buttons */}
      <div className="absolute bottom-24 right-6 flex flex-col gap-2">
        <button
          className="h-20 w-20 rounded-full bg-red-500/40 font-display text-sm"
          onTouchStart={(e) => { e.preventDefault(); playerRef.firing = true }}
          onTouchEnd={() => { playerRef.firing = false }}
        >
          FIRE
        </button>
        <div className="flex gap-2">
          <button
            className="h-12 w-12 rounded-full bg-white/15 text-xs"
            onTouchStart={(e) => { e.preventDefault(); playerRef.aiming = !playerRef.aiming }}
          >
            AIM
          </button>
          <button
            className="h-12 w-12 rounded-full bg-white/15 text-xs"
            onTouchStart={(e) => { e.preventDefault(); useGameStore.getState().cycleWeapon(1) }}
          >
            WPN
          </button>
        </div>
        <div className="flex gap-2">
          <button
            className="h-12 w-12 rounded-full bg-white/15 text-xs"
            onTouchStart={(e) => { e.preventDefault(); playerRef.meleeReq = true }}
          >
            MELEE
          </button>
          <button
            className="h-12 w-12 rounded-full bg-white/15 text-xs"
            onTouchStart={(e) => { e.preventDefault(); playerRef.grenadeReq = true }}
          >
            NADE
          </button>
        </div>
      </div>
    </div>
  )
}
