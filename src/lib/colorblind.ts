// Colorblind-safe palettes for critical gameplay signals.
// Red-green deficiencies (deuteranopia/protanopia) are the common case:
// swap red signals to blue/yellow, keep luminance differences.
export type ColorblindMode = 'off' | 'deuteranopia' | 'protanopia' | 'tritanopia'

export const COLORBLIND_LABELS: { id: ColorblindMode; label: string }[] = [
  { id: 'off', label: 'Off' },
  { id: 'deuteranopia', label: 'Green-weak' },
  { id: 'protanopia', label: 'Red-weak' },
  { id: 'tritanopia', label: 'Blue-weak' },
]

export function sanitizeColorblind(input: unknown): ColorblindMode {
  return input === 'deuteranopia' || input === 'protanopia' || input === 'tritanopia' ? input : 'off'
}

function pick(mode: ColorblindMode, def: number, rgSafe: number, blueSafe: number): number {
  if (mode === 'tritanopia') return blueSafe
  if (mode === 'off') return def
  return rgSafe
}

export const cb = {
  // Enemy eye glow (legacy 0xdd2222 red)
  eye: (mode: ColorblindMode): number => pick(mode, 0xdd2222, 0x00ccff, 0xff9500),
  // Hit flash on damaged zombies (legacy 0xaa0000)
  hitFlash: (mode: ColorblindMode): number => pick(mode, 0xaa0000, 0x0066ff, 0xff9500),
  // Non-head hitmarker white stays; head hitmarker yellow stays (luminance cue, safe)
  // Boss HP bar red → blue for RG-safe
  bossBar: (mode: ColorblindMode): string => (mode === 'off' ? '#ff4757' : mode === 'tritanopia' ? '#ff9500' : '#3aa0ff'),
  // Damage vignette tint
  vignette: (mode: ColorblindMode): string =>
    mode === 'off'
      ? 'radial-gradient(ellipse at center, rgba(255,30,30,0) 42%, rgba(255,35,35,.6) 100%)'
      : 'radial-gradient(ellipse at center, rgba(0,80,255,0) 42%, rgba(0,120,255,.65) 100%)',
}
