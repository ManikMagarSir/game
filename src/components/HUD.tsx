import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '../store/useGameStore'
import { useFxStore } from '../store/useFxStore'
import { useZombieStore } from '../store/useZombieStore'
import { ABILITIES, WEAPONS } from '../game/config'
import { applyAbility } from '../systems/progression'
import { BOSS_FORMS } from '../three/models/BossModel'
import { cb } from '../lib/colorblind'
import { useSettingsStore } from '../store/useSettingsStore'
import { audio } from '../systems/audio'
import Minimap from './Minimap'
import { prefersReducedMotion } from '../lib/a11y'
import { resetPlayer } from '../store/playerRef'
import { useEntStore } from '../store/useEntStore'
import { useMemo } from 'react'

export default function HUD(): React.JSX.Element {
  const phase = useGameStore((s) => s.phase)
  const health = useGameStore((s) => s.health)
  const maxHealth = useGameStore((s) => s.maxHealth)
  const xp = useGameStore((s) => s.xp)
  const xpToNext = useGameStore((s) => s.xpToNext)
  const level = useGameStore((s) => s.level)
  const kills = useGameStore((s) => s.kills)
  const wave = useGameStore((s) => s.wave)
  const cash = useGameStore((s) => s.cash)
  const score = useGameStore((s) => s.score)
  const pending = useGameStore((s) => s.pendingLevelUps)
  const curWeapon = useGameStore((s) => s.curWeapon)
  const ownedWeapons = useGameStore((s) => s.ownedWeapons)
  const grenades = useGameStore((s) => s.grenades)
  const timer = useGameStore((s) => s.timer)
  const mode = useGameStore((s) => s.mode)
  const beaconHp = useGameStore((s) => s.beaconHp)
  const beaconMaxHp = useGameStore((s) => s.beaconMaxHp)
  const overTitle = useGameStore((s) => s.overTitle)
  const hitmarker = useFxStore((s) => s.hitmarker)
  const hitHead = useFxStore((s) => s.hitmarkerHead)
  const dmgT = useFxStore((s) => s.dmgT)
  const dmgAngle = useFxStore((s) => s.dmgAngle)
  const banner = useFxStore((s) => s.banner)
  const bannerT = useFxStore((s) => s.bannerT)
  const zombies = useZombieStore((s) => s.list.length)
  const boss = useZombieStore((s) => s.list.find((z) => z.kind === 'boss'))
  const colorblind = useSettingsStore((s) => s.colorblind)
  const captions = useFxStore((s) => s.captions)

  const perks = useMemo(() => {
    if (pending <= 0) return []
    const pool = [...ABILITIES].sort(() => Math.random() - 0.5)
    return pool.slice(0, 3)
  }, [pending, level])

  if (phase === 'lobby') return <></>

  const hpPct = Math.max(0, (health / maxHealth) * 100)
  const xpPct = Math.min(100, (xp / xpToNext) * 100)

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* crosshair + hitmarker */}
      {phase === 'playing' && (
        <>
          <div className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2">
            <div className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 bg-accent shadow-[0_0_6px_rgba(77,231,255,.8)]" />
            <div className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 bg-accent shadow-[0_0_6px_rgba(77,231,255,.8)]" />
          </div>
          {hitmarker > 0 && (
            <div
              className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 ${hitHead ? 'bg-yellow-300' : 'bg-white'}`}
              style={{
                opacity: Math.min(1, hitmarker * 8),
                width: hitHead ? 28 : 20,
                height: hitHead ? 28 : 20,
              }}
              aria-hidden
            />
          )}
          {dmgT > 0 && !prefersReducedMotion() && (
            <>
              <div
                className="absolute inset-0"
                style={{
                  opacity: Math.min(0.6, dmgT),
                  background: cb.vignette(colorblind),
                }}
              />
              <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2" style={{ transform: `translate(-50%,-50%) rotate(${dmgAngle}rad)`, opacity: Math.min(1, dmgT * 1.5) }}>
                <div className="mx-auto h-10 w-16 bg-gradient-to-b from-red-500 to-transparent" style={{ clipPath: 'polygon(50% 0, 100% 100%, 0 100%)' }} />
              </div>
            </>
          )}
        </>
      )}

      {/* top-left bars */}
      <div className="absolute left-4 top-16 w-64">
        <div className="font-display text-xs tracking-widest text-txt">❤ HEALTH {Math.ceil(health)}</div>
        <div className="mt-1 h-3 overflow-hidden rounded bg-black/60 shadow-inset-sm">
          <div className={`h-full transition-all ${hpPct < 30 ? 'bg-bad' : 'bg-ok'}`} style={{ width: `${hpPct}%` }} />
        </div>
        <div className="mt-2 font-display text-xs tracking-widest text-txt">▲ LVL {level} XP</div>
        <div className="mt-1 h-1.5 overflow-hidden rounded bg-black/60">
          <div className="h-full bg-accent" style={{ width: `${xpPct}%` }} />
        </div>
        <div className="mt-2 font-display text-xs tracking-widest text-txt">☠ KILLS {kills} · WAVE {wave} · 🧟 {zombies}</div>
      </div>

      <div className="absolute right-4 top-16 rounded-panel bg-surface/80 px-3 py-2 text-right shadow-raised-sm">
        <div className="font-display text-sm text-accent2">${cash}</div>
        <div className="text-xs text-dim">SCORE {score}</div>
        <div className="text-xs text-txt">{WEAPONS[curWeapon].name} ∞ · 💣 {grenades} · F melee</div>
        <button
          onClick={() => {
            useGameStore.getState().setPhase('shop')
            try { document.exitPointerLock() } catch { /* noop */ }
          }}
          className="pointer-events-auto mt-1 w-full rounded bg-accent2 px-2 py-1 font-display text-xs text-black"
        >
          🛒 SHOP (B)
        </button>
        <div className="mt-1 flex gap-1">
          {WEAPONS.map((w, i) =>
            ownedWeapons[i] ? (
              <button
                key={w.id}
                onClick={() => useGameStore.getState().selectWeapon(i)}
                className={`pointer-events-auto rounded px-1 text-[10px] ${i === curWeapon ? 'bg-accent text-black' : 'bg-black/40 text-dim'}`}
              >
                {i + 1}
              </button>
            ) : null,
          )}
        </div>
        {mode === 'time' && <div className="mt-1 font-display text-sm text-warn">⏱ {Math.ceil(timer)}s</div>}
      </div>

      {mode === 'defense' && phase === 'playing' && (
        <div className="absolute left-1/2 top-16 w-72 -translate-x-1/2">
          <div className="text-center font-display text-xs tracking-widest text-txt">🛡 BEACON {Math.ceil(beaconHp)}</div>
          <div className="mt-1 h-2 overflow-hidden rounded bg-black/60">
            <div className="h-full bg-accent" style={{ width: `${(beaconHp / beaconMaxHp) * 100}%` }} />
          </div>
        </div>
      )}

      {boss && (phase === 'playing' || phase === 'paused') && (
        <div className="absolute left-1/2 top-24 w-96 -translate-x-1/2">
          <div className="text-center font-display text-xs tracking-[3px] text-bad">
            ⚠ BOSS · {BOSS_FORMS[Math.min(5, Math.max(1, boss.rage)) - 1]} · PHASE {boss.rage} ⚠
          </div>
          <div className="mt-1 h-3 overflow-hidden rounded bg-black/60">
            <div className="h-full transition-all" style={{ width: `${Math.max(0, (boss.hp / boss.maxHp) * 100)}%`, background: cb.bossBar(colorblind) }} />
          </div>
        </div>
      )}

      {/* banner */}
      <AnimatePresence>
        {bannerT > 0 && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute left-1/2 top-1/4 -translate-x-1/2 font-display text-3xl tracking-[6px] text-accent">
            {banner}
          </motion.div>
        )}
      </AnimatePresence>

      {/* captions for audio cues */}
      {captions.length > 0 && (
        <div aria-live="polite" className="absolute bottom-24 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1">
          {captions.map((c) => (
            <div key={c.id} className="rounded bg-black/70 px-3 py-1 text-xs text-txt" style={{ opacity: Math.min(1, c.t) }}>
              {c.text}
            </div>
          ))}
        </div>
      )}

      {/* level-up */}
      {pending > 0 && phase === 'playing' && (
        <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/70">
          <div className="w-[560px] rounded-panel bg-surface p-6 shadow-raised">
            <div className="font-display text-xl text-accent">LEVEL UP — choose a perk</div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {perks.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    const g = useGameStore.getState()
                    const res = applyAbility(p.id, g.mult, { max: g.maxHealth, cur: g.health })
                    useGameStore.setState({
                      mult: res.mult, maxHealth: res.hp.max, health: res.hp.cur,
                      pendingLevelUps: Math.max(0, g.pendingLevelUps - 1),
                    })
                    audio.levelup()
                  }}
                  className="rounded-panel bg-surface2 p-3 text-left shadow-raised-sm hover:outline hover:outline-accent"
                >
                  <div className="text-2xl">{p.ico}</div>
                  <div className="font-display text-sm">{p.name}</div>
                  <div className="text-xs text-dim">{p.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* game over */}
      {phase === 'gameover' && (
        <GameOverCard
          overTitle={overTitle} wave={wave} kills={kills} score={score} cash={cash} level={level}
        />
      )}
      {(phase === 'playing' || phase === 'paused') && <Minimap />}
    </div>
  )
}

function GameOverCard({ overTitle, wave, kills, score, cash, level }: { overTitle: string; wave: number; kills: number; score: number; cash: number; level: number }): React.JSX.Element {
  const shots = useGameStore((s) => s.shots)
  const hits = useGameStore((s) => s.hits)
  const heads = useGameStore((s) => s.headshots)
  const mode = useGameStore((s) => s.mode)
  const startRun = useGameStore((s) => s.startRun)
  const acc = shots > 0 ? Math.round((hits / shots) * 100) : 0
  const earned = Math.floor(score / 10)
  const restart = () => {
    resetPlayer()
    useZombieStore.getState().clear()
    useFxStore.getState().clear()
    useEntStore.getState().clear()
    startRun(mode)
    const el = document.querySelector('canvas')
    try { (el as HTMLCanvasElement | null)?.requestPointerLock?.() } catch { /* noop */ }
  }
  return (
    <div className="pointer-events-auto absolute inset-0 flex items-center justify-center bg-black/70">
      <div className="w-[400px] rounded-panel bg-surface p-6 text-center shadow-raised">
        <div className="font-display text-2xl text-bad">{overTitle || 'YOU DIED'}</div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
          <Stat label="SCORE" value={`${score}`} />
          <Stat label="WAVE" value={`${wave}`} />
          <Stat label="KILLS" value={`${kills}`} />
          <Stat label="LEVEL" value={`${level}`} />
          <Stat label="ACC" value={`${acc}%`} />
          <Stat label="HEADS" value={`${heads}`} />
        </div>
        <div className="mt-2 text-xs text-dim">Cash ${cash} · +{earned} career credits banked</div>
        <div className="mt-4 flex gap-2">
          <button onClick={restart} className="flex-1 rounded-panel bg-accent px-3 py-2 font-display text-black">
            RETRY
          </button>
          <button
            onClick={() => {
              useZombieStore.getState().clear()
              useFxStore.getState().clear()
              useEntStore.getState().clear()
              useGameStore.getState().setPhase('lobby')
            }}
            className="flex-1 rounded-panel bg-surface2 px-3 py-2 font-display"
          >
            MENU
          </button>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <div className="rounded bg-black/30 p-2">
      <div className="font-display text-accent">{value}</div>
      <div className="text-[10px] tracking-widest text-dim">{label}</div>
    </div>
  )
}
