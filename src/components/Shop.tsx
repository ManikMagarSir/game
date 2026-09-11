import { motion } from 'framer-motion'
import { SHOP_ITEMS } from '../game/config'
import { useGameStore } from '../store/useGameStore'
import { useEntStore } from '../store/useEntStore'
import { playerRef } from '../store/playerRef'
import { audio } from '../systems/audio'

function owned(key: string | undefined, once: boolean | undefined): boolean {
  if (!once || !key) return false
  const s = useGameStore.getState()
  if (key[0] === 'w') return !!s.ownedWeapons[+key[1]]
  if (key === 'sup') return !!s.attach.sup
  if (key === 'scope') return !!s.attach.scope
  return false
}

export default function Shop(): React.JSX.Element {
  const phase = useGameStore((s) => s.phase)
  const cash = useGameStore((s) => s.cash)
  const buy = useGameStore((s) => s.buyShopItem)
  const mode = useGameStore((s) => s.mode)
  const beaconHp = useGameStore((s) => s.beaconHp)
  const beaconMaxHp = useGameStore((s) => s.beaconMaxHp)
  const turrets = useEntStore((s) => s.turrets.length)
  if (phase !== 'shop') return <></>
  return (
    <div className="pointer-events-auto absolute inset-0 z-20 flex items-center justify-center bg-black/70">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-h-[80vh] w-[600px] overflow-y-auto rounded-panel bg-surface p-6 shadow-raised">
        <div className="flex items-center justify-between">
          <div className="font-display text-xl text-accent2">FIELD SHOP</div>
          <div className="font-display text-accent2">${cash}</div>
        </div>
        <p className="mt-1 text-xs text-dim">B / ESC to close. Medkit and grenades apply instantly; guns join loadout (1-8/wheel).</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {SHOP_ITEMS.map((it) => {
            const isOwned = owned(it.key, it.once)
            const afford = cash >= it.cost
            return (
              <button
                key={it.id}
                disabled={isOwned || !afford}
                onClick={() => buy(it.id)}
                className="rounded-panel bg-surface2 p-3 text-left shadow-raised-sm disabled:opacity-40 hover:outline hover:outline-accent2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">{it.ico}</span>
                  <span className="font-display text-sm text-accent2">{isOwned ? 'OWNED' : `$${it.cost}`}</span>
                </div>
                <div className="font-display text-sm">{it.name}</div>
                <div className="text-xs text-dim">{it.desc}</div>
              </button>
            )
          })}
          {mode === 'defense' && (
            <button
              disabled={cash < 200 || beaconHp >= beaconMaxHp}
              onClick={() => {
                const g = useGameStore.getState()
                if (g.cash < 200) return
                useGameStore.setState({
                  cash: g.cash - 200,
                  beaconHp: Math.min(g.beaconMaxHp, g.beaconHp + 250),
                })
                audio.tone(880, 0.08, 'square', 0.05)
              }}
              className="rounded-panel bg-surface2 p-3 text-left shadow-raised-sm disabled:opacity-40 hover:outline hover:outline-accent2"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">🛠</span>
                <span className="font-display text-sm text-accent2">$200</span>
              </div>
              <div className="font-display text-sm">Repair Beacon +250</div>
              <div className="text-xs text-dim">Defense only · {Math.ceil(beaconHp)}/{beaconMaxHp} HP</div>
            </button>
          )}
          <button
            disabled={cash < 500 || turrets >= 2}
            onClick={() => {
              const g = useGameStore.getState()
              if (g.cash < 500 || useEntStore.getState().turrets.length >= 2) return
              const a = playerRef.yaw
              const ok = useEntStore.getState().deployTurret(
                playerRef.x - Math.sin(a) * 3,
                playerRef.z - Math.cos(a) * 3,
              )
              if (ok) {
                useGameStore.setState({ cash: g.cash - 500 })
                audio.tone(880, 0.08, 'square', 0.05)
              }
            }}
            className="rounded-panel bg-surface2 p-3 text-left shadow-raised-sm disabled:opacity-40 hover:outline hover:outline-accent2"
          >
            <div className="flex items-center justify-between">
              <span className="text-lg">🤖</span>
              <span className="font-display text-sm text-accent2">{turrets >= 2 ? 'MAX 2' : '$500'}</span>
            </div>
            <div className="font-display text-sm">Auto-Turret</div>
            <div className="text-xs text-dim">Deploys ahead · 20dmg @ 4/s · 25m range</div>
          </button>
        </div>
        <button
          onClick={() => {
            useGameStore.getState().setPhase('playing')
            const el = document.querySelector('canvas')
            try { (el as HTMLCanvasElement | null)?.requestPointerLock?.() } catch { /* noop */ }
          }}
          className="mt-4 w-full rounded-panel bg-accent px-3 py-2 font-display text-black"
        >
          CLOSE (B)
        </button>
      </motion.div>
    </div>
  )
}
