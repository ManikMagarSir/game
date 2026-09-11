// Hot mutable player state — never in React state (60Hz writes).
// Mirrors G.player/yaw/pitch/recoil/shake/keys/firing/aiming from js/state.js:5.
export const playerRef = {
  x: 0,
  z: 0,
  y: 1.7,
  yaw: 0,
  pitch: 0,
  recoilP: 0,
  recoilY: 0,
  shake: 0,
  firing: false,
  aiming: false,
  keys: {} as Record<string, boolean>,
  weaponTimer: 0,
  meleeCd: 0,
  switchCd: 0,
  meleeReq: false,
  grenadeReq: false,
}

export function resetPlayer(): void {
  playerRef.x = 0
  playerRef.z = 0
  playerRef.yaw = 0
  playerRef.pitch = 0
  playerRef.recoilP = 0
  playerRef.recoilY = 0
  playerRef.shake = 0
  playerRef.firing = false
  playerRef.aiming = false
  playerRef.weaponTimer = 0
  playerRef.meleeCd = 0
  playerRef.switchCd = 0
  playerRef.meleeReq = false
  playerRef.grenadeReq = false
  playerRef.keys = {}
}
