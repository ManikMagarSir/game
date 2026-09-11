import { motion } from 'framer-motion'
import GameCanvas from './canvas/GameCanvas'
import HUD from './components/HUD'
import Shop from './components/Shop'
import CareerShop from './components/CareerShop'
import { useGameStore } from './store/useGameStore'
import { useProfileStore } from './store/useProfileStore'
import { gfxConfig, useSettingsStore } from './store/useSettingsStore'
import { resetPlayer } from './store/playerRef'
import { useZombieStore } from './store/useZombieStore'
import { useFxStore } from './store/useFxStore'
import { useEntStore } from './store/useEntStore'
import IntroCanvas from './components/IntroCanvas'
import ProfileBar from './components/ProfileBar'
import BindEditor from './components/BindEditor'
import TouchControls from './components/TouchControls'
import { useGamepad } from './hooks/useGamepad'
import { COLORBLIND_LABELS, type ColorblindMode } from './lib/colorblind'
import { audio } from './systems/audio'
import { music } from './systems/music'
import { useEffect, useRef, useState } from 'react'
import { MODES } from './game/config'
import type { GameMode, GfxTier } from './game/types'

export default function App() {
  const phase = useGameStore((s) => s.phase)
  const mode = useGameStore((s) => s.mode)
  const startRun = useGameStore((s) => s.startRun)
  const setPhase = useGameStore((s) => s.setPhase)
  const gfx = useSettingsStore((s) => s.gfx)
  const setSettings = useSettingsStore((s) => s.set)
  const cfg = gfxConfig(gfx)
  const [unlockAll, setUnlockAll] = useState(true)
  const pendingMode = useRef<GameMode>('endless')
  useGamepad()

  // Boot: profiles (with legacy migration) → hydrate runtime stores
  useEffect(() => {
    useProfileStore.getState().ensure()
    const b = useProfileStore.getState().bundle
    useGameStore.setState({ career: b.career })
    setSettings({ ...b.settings })
    audio.setVolume(b.settings.muted ? 0 : b.settings.volume)
    // Write-through: settings → active profile
    const unsub = useSettingsStore.subscribe((s) => {
      try {
        useProfileStore.getState().patch({
          settings: { sensitivity: s.sensitivity, volume: s.volume, gfx: s.gfx, fov: s.fov, invertY: s.invertY, muted: s.muted, binds: { ...s.binds }, colorblind: s.colorblind },
        })
      } catch { /* boot */ }
    })
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const launch = (m: GameMode) => {
    resetPlayer()
    useZombieStore.getState().clear()
    useFxStore.getState().clear()
    useEntStore.getState().clear()
    startRun(m)
    if (unlockAll) {
      useGameStore.setState({
        ownedWeapons: { 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true },
      })
    }
    music.start()
    const el = document.querySelector('canvas')
    try { (el as HTMLCanvasElement | null)?.requestPointerLock?.() } catch { /* cooldown handles */ }
  }

  const begin = (m: GameMode) => {
    audio.init()
    audio.resume()
    pendingMode.current = m
    useGameStore.setState({ mode: m, phase: 'intro' })
  }

  return (
    <div className="relative h-full w-full bg-bg text-txt font-ui overflow-hidden">
      <GameCanvas />
      <HUD />
      <Shop />
      <MusicSync />
      <TouchControls />
      {phase === 'intro' && <IntroCanvas onDone={() => launch(pendingMode.current)} />}

      <div className="pointer-events-none absolute left-4 top-4 rounded-panel bg-surface/80 px-4 py-2 shadow-raised-sm">
        <div className="font-display text-sm tracking-widest text-accent">VOXEL SURVIVOR R3F</div>
        <div className="text-xs text-dim">{phase.toUpperCase()} · {MODES[mode].name} · {gfx.toUpperCase()} dpr:{cfg.dpr}</div>
      </div>

      <div className="absolute right-4 top-4 flex gap-1 rounded-panel bg-surface/80 p-1 shadow-raised-sm">
        {(['low', 'medium', 'high'] as GfxTier[]).map((g) => (
          <button
            key={g}
            onClick={() => setSettings({ gfx: g })}
            className={`rounded px-2 py-1 text-xs ${gfx === g ? 'bg-accent text-black' : 'text-dim'}`}
          >
            {g}
          </button>
        ))}
      </div>

      {phase === 'lobby' && (
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="pointer-events-auto max-h-[90vh] w-[420px] overflow-y-auto rounded-panel bg-surface p-6 shadow-raised">
            <h1 className="font-display text-2xl text-accent">VOXEL SURVIVOR</h1>
            <p className="mt-1 text-sm text-dim">1-8 / wheel to swap · F melee · G grenade · B shop.</p>
            <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-dim">
              <input type="checkbox" checked={unlockAll} onChange={(e) => setUnlockAll(e.target.checked)} />
              Unlock all weapons (skip shop grind)
            </label>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <label className="text-dim">
                Sensitivity {useSettingsStore.getState().sensitivity.toFixed(2)}
                <input
                  type="range" min={0.3} max={2.5} step={0.05}
                  defaultValue={useSettingsStore.getState().sensitivity}
                  onChange={(e) => setSettings({ sensitivity: Number(e.target.value) })}
                  className="w-full"
                />
              </label>
              <label className="text-dim">
                Volume {useSettingsStore.getState().muted ? 'MUTED' : `${Math.round(useSettingsStore.getState().volume * 100)}%`}
                <input
                  type="range" min={0} max={1} step={0.05}
                  defaultValue={useSettingsStore.getState().volume}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setSettings({ volume: v })
                    audio.setVolume(useSettingsStore.getState().muted ? 0 : v)
                  }}
                  className="w-full"
                />
              </label>
              <label className="text-dim">
                FOV {useSettingsStore.getState().fov}
                <input
                  type="range" min={60} max={110} step={1}
                  defaultValue={useSettingsStore.getState().fov}
                  onChange={(e) => setSettings({ fov: Number(e.target.value) })}
                  className="w-full"
                />
              </label>
              <div className="flex items-end gap-3 pb-1 text-dim">
                <label className="flex cursor-pointer items-center gap-1">
                  <input
                    type="checkbox"
                    defaultChecked={useSettingsStore.getState().invertY}
                    onChange={(e) => setSettings({ invertY: e.target.checked })}
                  />
                  Invert Y
                </label>
                <label className="flex cursor-pointer items-center gap-1">
                  <input
                    type="checkbox"
                    defaultChecked={useSettingsStore.getState().muted}
                    onChange={(e) => {
                      setSettings({ muted: e.target.checked })
                      audio.setVolume(e.target.checked ? 0 : useSettingsStore.getState().volume)
                    }}
                  />
                  Mute
                </label>
              </div>
              <label className="col-span-2 text-dim">
                Colorblind mode
                <select
                  defaultValue={useSettingsStore.getState().colorblind}
                  onChange={(e) => setSettings({ colorblind: e.target.value as ColorblindMode })}
                  className="mt-1 w-full rounded bg-black/40 px-2 py-1 text-sm text-txt"
                  aria-label="Colorblind mode"
                >
                  {COLORBLIND_LABELS.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {(Object.keys(MODES) as GameMode[]).map((m) => (
                <button
                  key={m}
                  aria-label={`Play ${MODES[m].name}`}
                  onClick={() => begin(m)}
                  className="rounded-panel bg-surface2 px-3 py-2 text-left shadow-raised-sm hover:outline hover:outline-accent"
                >
                  <span className="mr-2">{MODES[m].ico}</span>
                  <span className="text-sm">{MODES[m].name}</span>
                </button>
              ))}
            </div>
            <div className="mt-4">
              <CareerShop />
            </div>
            <div className="mt-2">
              <ProfileBar />
            </div>
            <div className="mt-2">
              <BindEditor />
            </div>
          </div>
        </motion.div>
      )}

      {phase === 'paused' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="pointer-events-auto w-[320px] rounded-panel bg-surface p-6 text-center shadow-raised">
            <div className="font-display text-xl text-warn">PAUSED</div>
            <p className="mt-1 text-sm text-dim">Lock lost (Esc / tab switch). Click resume, then canvas if needed.</p>
            <button
              onClick={() => {
                setPhase('playing')
                const el = document.querySelector('canvas')
                try { (el as HTMLCanvasElement | null)?.requestPointerLock?.() } catch { /* noop */ }
              }}
              aria-label="Resume game"
              className="mt-4 w-full rounded-panel bg-accent px-3 py-2 font-display text-black"
            >
              RESUME
            </button>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => launch(mode)}
                aria-label="Restart run"
                className="flex-1 rounded-panel bg-surface2 px-3 py-2 font-display text-sm"
              >
                RESTART
              </button>
              <button
                onClick={() => {
                  useZombieStore.getState().clear()
                  useFxStore.getState().clear()
                  useEntStore.getState().clear()
                  setPhase('lobby')
                }}
                aria-label="Quit to menu"
                className="flex-1 rounded-panel bg-surface2 px-3 py-2 font-display text-sm"
              >
                MENU
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function MusicSync(): null {
  const phase = useGameStore((s) => s.phase)
  const wave = useGameStore((s) => s.wave)
  const toSpawn = useGameStore((s) => s.toSpawn)
  const zombies = useZombieStore((s) => s.list.length)
  useEffect(() => {
    if (phase === 'playing') {
      music.start()
      music.setIntensity(Math.min(1, 0.35 + wave * 0.06 + (toSpawn + zombies) * 0.01))
    } else {
      music.setIntensity(0.2)
    }
  }, [phase, wave, toSpawn, zombies])
  return null
}
