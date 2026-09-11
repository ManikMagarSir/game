import { useRef, useState } from 'react'
import { useProfileStore, type ProfileBundle } from '../store/useProfileStore'
import { useGameStore } from '../store/useGameStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { audio } from '../systems/audio'
import { sanitizeBinds } from '../lib/binds'
import { sanitizeColorblind } from '../lib/colorblind'

function applyBundle(): void {
  const b = useProfileStore.getState().bundle
  const sens = Number(b.settings?.sensitivity)
  const vol = Number(b.settings?.volume)
  const fov = Number((b.settings as Record<string, unknown>)?.fov)
  useGameStore.setState({ career: b.career })
  useSettingsStore.setState({
    sensitivity: Number.isFinite(sens) ? Math.min(2.5, Math.max(0.3, sens)) : 1,
    volume: Number.isFinite(vol) ? Math.min(1, Math.max(0, vol)) : 0.6,
    gfx: b.settings?.gfx === 'low' || b.settings?.gfx === 'high' ? b.settings.gfx : 'medium',
    fov: Number.isFinite(fov) ? Math.min(110, Math.max(60, fov)) : 75,
    invertY: (b.settings as Record<string, unknown>)?.invertY === true,
    muted: (b.settings as Record<string, unknown>)?.muted === true,
    binds: sanitizeBinds((b.settings as Record<string, unknown>)?.binds),
    colorblind: sanitizeColorblind((b.settings as Record<string, unknown>)?.colorblind),
  })
  audio.setVolume(useSettingsStore.getState().muted ? 0 : Number.isFinite(vol) ? vol : 0.6)
}

export default function ProfileBar(): React.JSX.Element {
  const profiles = useProfileStore((s) => s.profiles)
  const active = useProfileStore((s) => s.active)
  const bundle = useProfileStore((s) => s.bundle)
  const [name, setName] = useState('')
  const file = useRef<HTMLInputElement>(null)

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ name: active, ...bundle }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `voxel-profile_${active}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const importJSON = (f: File) => {
    f.text().then((t) => {
      try {
        const d = JSON.parse(t) as Record<string, unknown>
        const clean = String(d.name || f.name.replace(/\.json$/i, '') || 'IMPORT').toUpperCase().slice(0, 16)
        useProfileStore.getState().create(clean)
        const patch: Partial<ProfileBundle> = {}
        if (d.career && typeof d.career === 'object') patch.career = d.career as ProfileBundle['career']
        if (d.settings && typeof d.settings === 'object') patch.settings = d.settings as ProfileBundle['settings']
        if (d.best && typeof d.best === 'object') patch.best = d.best as ProfileBundle['best']
        useProfileStore.getState().patch(patch)
        applyBundle()
      } catch { /* bad file */ }
    })
  }

  return (
    <div className="rounded-panel bg-surface p-4 shadow-raised-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="font-display text-sm tracking-widest text-accent">PROFILE</div>
        <div className="text-xs text-dim">BEST {bundle.best.score} · WAVE {bundle.best.wave}</div>
      </div>
      <div className="mt-2 flex gap-2">
        <select
          value={active}
          onChange={(e) => {
            useProfileStore.getState().switchTo(e.target.value)
            applyBundle()
          }}
          className="flex-1 rounded bg-black/40 px-2 py-1 text-sm"
        >
          {profiles.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <button
          onClick={() => {
            if (confirm(`Delete profile ${active}?`)) {
              useProfileStore.getState().remove(active)
              applyBundle()
            }
          }}
          className="rounded bg-bad/20 px-2 text-xs text-bad"
        >
          DEL
        </button>
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value.toUpperCase().slice(0, 16))}
          placeholder="NEW NAME"
          className="flex-1 rounded bg-black/40 px-2 py-1 text-sm"
        />
        <button
          onClick={() => {
            if (!name.trim()) return
            useProfileStore.getState().create(name)
            setName('')
            applyBundle()
          }}
          className="rounded bg-accent px-2 text-xs font-display text-black"
        >
          ADD
        </button>
      </div>
      <div className="mt-2 flex gap-2 text-xs">
        <button onClick={exportJSON} className="flex-1 rounded bg-surface2 px-2 py-1 text-dim">EXPORT ↓</button>
        <button onClick={() => file.current?.click()} className="flex-1 rounded bg-surface2 px-2 py-1 text-dim">IMPORT ↑</button>
        <input
          ref={file} type="file" accept="application/json" className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) importJSON(f)
            e.target.value = ''
          }}
        />
      </div>
    </div>
  )
}
