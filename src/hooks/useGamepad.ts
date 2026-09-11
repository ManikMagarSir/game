import { useEffect } from 'react'
import { playerRef } from '../store/playerRef'
import { useGameStore } from '../store/useGameStore'
import { useSettingsStore } from '../store/useSettingsStore'

// Standard-mapping gamepad: left stick move, right stick look, RT fire,
// RB/LB cycle, X melee, Y grenade. Polls at rAF, writes playerRef (no re-render).
export function useGamepad(): void {
  useEffect(() => {
    let raf = 0
    let prevMelee = false
    let prevNade = false
    let prevCycleR = false
    let prevCycleL = false
    const dz = (v: number) => (Math.abs(v) < 0.22 ? 0 : v)
    const loop = () => {
      raf = requestAnimationFrame(loop)
      if (useGameStore.getState().phase !== 'playing') return
      const gp = navigator.getGamepads?.()?.[0]
      if (!gp || !gp.connected) return
      const [lx, ly, rx, ry] = [dz(gp.axes[0] ?? 0), dz(gp.axes[1] ?? 0), dz(gp.axes[2] ?? 0), dz(gp.axes[3] ?? 0)]
      const binds = useSettingsStore.getState().binds
      playerRef.keys[binds.forward] = ly < -0.01
      playerRef.keys[binds.back] = ly > 0.01
      playerRef.keys[binds.left] = lx < -0.01
      playerRef.keys[binds.right] = lx > 0.01
      const { sensitivity, invertY } = useSettingsStore.getState()
      const my = invertY ? -ry : ry
      playerRef.yaw -= rx * 0.045 * sensitivity
      playerRef.pitch = Math.max(-1.45, Math.min(1.45, playerRef.pitch - my * 0.045 * sensitivity))
      const btn = (i: number) => gp.buttons[i]?.pressed ?? false
      playerRef.firing = btn(7) || btn(5)
      if (btn(2) && !prevMelee) playerRef.meleeReq = true
      if (btn(3) && !prevNade) playerRef.grenadeReq = true
      if (btn(4) && !prevCycleL) useGameStore.getState().cycleWeapon(-1)
      if (btn(6) && !prevCycleR) useGameStore.getState().cycleWeapon(1)
      prevMelee = btn(2)
      prevNade = btn(3)
      prevCycleL = btn(4)
      prevCycleR = btn(6)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])
}
