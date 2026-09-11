export interface Binds {
  forward: string
  back: string
  left: string
  right: string
  sprint: string
  melee: string
  grenade: string
  shop: string
}

export const DEFAULT_BINDS: Binds = {
  forward: 'KeyW',
  back: 'KeyS',
  left: 'KeyA',
  right: 'KeyD',
  sprint: 'ShiftLeft',
  melee: 'KeyF',
  grenade: 'KeyG',
  shop: 'KeyB',
}

export const BIND_LABELS: { id: keyof Binds; label: string }[] = [
  { id: 'forward', label: 'Forward' },
  { id: 'back', label: 'Back' },
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
  { id: 'sprint', label: 'Sprint' },
  { id: 'melee', label: 'Melee' },
  { id: 'grenade', label: 'Grenade' },
  { id: 'shop', label: 'Shop' },
]

export function sanitizeBinds(input: unknown): Binds {
  const out = { ...DEFAULT_BINDS }
  if (input && typeof input === 'object') {
    const d = input as Record<string, unknown>
    for (const k of Object.keys(DEFAULT_BINDS) as (keyof Binds)[]) {
      if (typeof d[k] === 'string' && (d[k] as string).length > 0) out[k] = d[k] as string
    }
  }
  return out
}

// Movement readers with arrow-key fallbacks that always work.
export function moveState(keys: Record<string, boolean>, b: Binds): { f: boolean; bk: boolean; l: boolean; r: boolean; sprint: boolean } {
  return {
    f: !!keys[b.forward] || !!keys['ArrowUp'],
    bk: !!keys[b.back] || !!keys['ArrowDown'],
    l: !!keys[b.left] || !!keys['ArrowLeft'],
    r: !!keys[b.right] || !!keys['ArrowRight'],
    sprint: !!keys[b.sprint] || !!keys['ShiftRight'],
  }
}

export function prettyCode(code: string): string {
  return code
    .replace(/^Key/, '')
    .replace(/^Digit/, '')
    .replace('ShiftLeft', 'Shift')
    .replace('ShiftRight', 'R-Shift')
    .replace('ArrowUp', '↑')
    .replace('ArrowDown', '↓')
    .replace('ArrowLeft', '←')
    .replace('ArrowRight', '→')
    .replace('Space', 'Space')
}
