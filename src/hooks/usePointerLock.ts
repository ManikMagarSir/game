import { useCallback, useEffect, useRef } from 'react'
import { playerRef } from '../store/playerRef'
import { useGameStore } from '../store/useGameStore'
import { useSettingsStore } from '../store/useSettingsStore'

// Robust pointer-lock with cooldown + auto-pause (fixes legacy silent swallow).
export function usePointerLock(canvas: HTMLCanvasElement | null): { lock: () => void; locked: boolean } {
  const cooldown = useRef(0)

  const lock = useCallback(() => {
    if (!canvas) return
    const now = performance.now()
    if (now - cooldown.current < 1200) return
    cooldown.current = now
    try {
      const p = canvas.requestPointerLock() as unknown as Promise<void> | undefined
      if (p && typeof (p as Promise<void>).catch === 'function') (p as Promise<void>).catch(() => {})
    } catch { /* user gesture required */ }
  }, [canvas])

  useEffect(() => {
    if (!canvas) return
    const onMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== canvas) return
      if (useGameStore.getState().phase !== 'playing') return
      const { sensitivity, invertY } = useSettingsStore.getState()
      const my = invertY ? -e.movementY : e.movementY
      playerRef.yaw -= e.movementX * 0.0022 * sensitivity
      playerRef.pitch = Math.max(-1.45, Math.min(1.45, playerRef.pitch - my * 0.0022 * sensitivity))
    }
    const onDown = (e: MouseEvent) => {
      if (useGameStore.getState().phase !== 'playing') return
      if (document.pointerLockElement !== canvas) {
        lock()
        return
      }
      if (e.button === 0) playerRef.firing = true
      if (e.button === 2) playerRef.aiming = true
    }
    const onUp = (e: MouseEvent) => {
      if (e.button === 0) playerRef.firing = false
      if (e.button === 2) playerRef.aiming = false
    }
    const onLockChange = () => {
      const locked = document.pointerLockElement === canvas
      if (!locked && useGameStore.getState().phase === 'playing') {
        useGameStore.getState().setPhase('paused')
      }
    }
    const onVis = () => {
      if (document.hidden && useGameStore.getState().phase === 'playing') {
        useGameStore.getState().setPhase('paused')
        try { document.exitPointerLock() } catch { /* noop */ }
      }
    }
    const onCtx = (e: Event) => e.preventDefault()
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    document.addEventListener('pointerlockchange', onLockChange)
    document.addEventListener('visibilitychange', onVis)
    canvas.addEventListener('contextmenu', onCtx)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      document.removeEventListener('pointerlockchange', onLockChange)
      document.removeEventListener('visibilitychange', onVis)
      canvas.removeEventListener('contextmenu', onCtx)
    }
  }, [canvas, lock])

  return { lock, locked: false }
}
