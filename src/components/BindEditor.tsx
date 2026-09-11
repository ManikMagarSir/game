import { useEffect, useState } from 'react'
import { BIND_LABELS, prettyCode, type Binds } from '../lib/binds'
import { useSettingsStore } from '../store/useSettingsStore'

// Click-to-rebind key editor. Escape cancels; Digit/arrows reserved for slots/look fallback.
export default function BindEditor(): React.JSX.Element {
  const binds = useSettingsStore((s) => s.binds)
  const set = useSettingsStore((s) => s.set)
  const [capture, setCapture] = useState<keyof Binds | null>(null)

  useEffect(() => {
    if (!capture) return
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.code === 'Escape') {
        setCapture(null)
        return
      }
      set({ binds: { ...useSettingsStore.getState().binds, [capture]: e.code } })
      setCapture(null)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [capture, set])

  return (
    <div className="rounded-panel bg-surface p-4 shadow-raised-sm">
      <div className="font-display text-sm tracking-widest text-accent">KEYBINDS</div>
      <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
        {BIND_LABELS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setCapture(id)}
            className={`flex items-center justify-between rounded bg-black/40 px-2 py-1 ${capture === id ? 'outline outline-accent' : ''}`}
            aria-label={`Rebind ${label}`}
          >
            <span className="text-dim">{label}</span>
            <span className="font-display text-accent">{capture === id ? '…' : prettyCode(binds[id])}</span>
          </button>
        ))}
      </div>
      <div className="mt-1 text-[10px] text-dim">Click, then press a key. Esc cancels. 1-8 + arrows always work.</div>
    </div>
  )
}
