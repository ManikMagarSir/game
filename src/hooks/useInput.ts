import { useEffect } from 'react'
import { playerRef } from '../store/playerRef'
import { useGameStore } from '../store/useGameStore'
import { useSettingsStore } from '../store/useSettingsStore'

// Port of js/input.js:9 keyboard. Mouse/pointer-lock lives in usePointerLock.
export function useInput(): void {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      playerRef.keys[e.code] = true
      const st = useGameStore.getState()
      const binds = useSettingsStore.getState().binds
      if (e.code === 'Escape' && st.phase === 'shop') {
        st.setPhase('playing')
        const el = document.querySelector('canvas')
        try { (el as HTMLCanvasElement | null)?.requestPointerLock?.() } catch { /* noop */ }
        return
      }
      if (st.phase === 'shop') {
        if (e.code === binds.shop) st.setPhase('playing')
        return
      }
      if (st.phase !== 'playing') return
      if (e.code === binds.shop) {
        st.setPhase('shop')
        try { document.exitPointerLock() } catch { /* noop */ }
        return
      }
      if (e.code.startsWith('Digit')) {
        const n = Number(e.code.slice(5)) - 1
        if (n >= 0 && n < 8) st.selectWeapon(n)
      }
      else if (e.code === binds.melee) playerRef.meleeReq = true
      else if (e.code === binds.grenade) playerRef.grenadeReq = true
    }
    const up = (e: KeyboardEvent) => {
      playerRef.keys[e.code] = false
    }
    const wheel = (e: WheelEvent) => {
      if (useGameStore.getState().phase !== 'playing') return
      useGameStore.getState().cycleWeapon(e.deltaY > 0 ? 1 : -1)
    }
    const blur = () => {
      playerRef.keys = {}
      playerRef.firing = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('wheel', wheel)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('wheel', wheel)
      window.removeEventListener('blur', blur)
    }
  }, [])
}
