import { CAREER_UPGRADES } from '../game/config'
import { useGameStore } from '../store/useGameStore'

export default function CareerShop(): React.JSX.Element {
  const career = useGameStore((s) => s.career)
  const buy = useGameStore((s) => s.buyCareer)
  return (
    <div className="rounded-panel bg-surface p-4 shadow-raised-sm">
      <div className="flex items-center justify-between">
        <div className="font-display text-sm tracking-widest text-accent2">CAREER</div>
        <div className="font-display text-sm text-accent2">💰 {career.credits}</div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {CAREER_UPGRADES.map((u) => {
          const lvl = career.upg[u.id]
          const maxed = lvl >= u.max
          const cost = maxed ? 0 : u.cost(lvl)
          return (
            <button
              key={u.id}
              disabled={maxed || career.credits < cost}
              onClick={() => buy(u.id)}
              className="rounded-panel bg-surface2 p-2 text-left text-xs shadow-raised-sm disabled:opacity-40"
            >
              <div className="flex justify-between">
                <span>{u.ico} {u.name} {lvl}/{u.max}</span>
                <span className="text-accent2">{maxed ? 'MAX' : `$${cost}`}</span>
              </div>
              <div className="text-dim">{u.desc}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
