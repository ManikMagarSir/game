import { useEffect, useRef, useState } from 'react'
import { audio } from '../systems/audio'

// Compact homage to js/intro.js:469 — 4 chapters, ~7s, click/space advance, ESC/skip.
const CHAPTERS = [
  { key: 'DAY 214', sub: 'The city fell silent weeks ago.', dur: 1.6, moon: '#e8f2ff', blood: false },
  { key: 'THE OUTBREAK', sub: 'No cure. No evacuation.', dur: 1.7, moon: '#ff6a52', blood: true },
  { key: 'THE BARRICADE', sub: 'The beacon keeps the dark back.', dur: 1.7, moon: '#c9d6ee', blood: false },
  { key: 'LAST SURVIVOR', sub: 'Hold the line. Survive the night.', dur: 1.9, moon: '#e8f2ff', blood: false },
]

export default function IntroCanvas({ onDone }: { onDone: () => void }): React.JSX.Element {
  const ref = useRef<HTMLCanvasElement>(null)
  const [idx, setIdx] = useState(0)
  const [sub, setSub] = useState('')
  const [prog, setProg] = useState(0)
  const done = useRef(onDone)
  done.current = onDone
  const nextRef = useRef(() => {})

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let ci = 0
    let elapsed = 0
    let last = performance.now()
    let raf = 0
    let running = true
    let typeStart = -1
    const buildings = Array.from({ length: 24 }, (_, i) => ({ x: i / 24, w: 0.025 + Math.random() * 0.03, h: 0.2 + Math.random() * 0.4 }))
    const horde = Array.from({ length: 40 }, () => ({ x: Math.random() * 1.2 - 0.1, y: 0.55 + Math.random() * 0.4, s: 6 + Math.random() * 14, ph: Math.random() * 6 }))
    const rain = Array.from({ length: 120 }, () => ({ x: Math.random(), y: Math.random(), sp: 0.5 + Math.random() }))
    const embers = Array.from({ length: 50 }, () => ({ x: Math.random(), y: Math.random(), v: 0.03 + Math.random() * 0.05, ph: Math.random() * 6 }))

    const finish = () => {
      if (!running) return
      running = false
      cancelAnimationFrame(raf)
      done.current()
    }
    const next = () => {
      if (ci < CHAPTERS.length - 1) {
        ci++
        elapsed = 0
        typeStart = -1
        setIdx(ci)
        setSub('')
        if (ci === 1) audio.explosion()
        else audio.tone(680, 0.1, 'square', 0.04, 220)
      } else finish()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); next() }
      else if (e.code === 'Escape') finish()
    }
    window.addEventListener('keydown', onKey)

    const frame = (ms: number) => {
      if (!running) return
      raf = requestAnimationFrame(frame)
      const dt = Math.min(0.05, (ms - last) / 1000)
      last = ms
      const W = (cv.width = cv.clientWidth)
      const H = (cv.height = cv.clientHeight)
      const now = ms * 0.001
      const ch = CHAPTERS[ci]
      const t = Math.min(1, elapsed / ch.dur)
      elapsed += dt

      // sky
      const sky = ctx.createLinearGradient(0, 0, 0, H)
      if (ch.blood) { sky.addColorStop(0, '#1a0a0c'); sky.addColorStop(1, '#0a0407') }
      else { sky.addColorStop(0, '#1a2c44'); sky.addColorStop(1, '#0a0f16') }
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, W, H)
      // moon
      ctx.fillStyle = ch.moon
      ctx.beginPath()
      ctx.arc(W * 0.7, H * 0.28, H * 0.08, 0, Math.PI * 2)
      ctx.fill()
      // skyline
      ctx.fillStyle = '#050910'
      const baseY = H * 0.72
      for (const b of buildings) {
        const bx = ((b.x - t * 0.02) % 1.2) * W
        ctx.fillRect(bx, baseY - b.h * H * 0.5, b.w * W, b.h * H * 0.5)
      }
      ctx.fillStyle = '#04060c'
      ctx.fillRect(0, baseY, W, H - baseY)
      if (ch.blood) {
        // fires + horde
        for (let i = 0; i < 5; i++) {
          const fx = (0.1 + i * 0.2) * W
          const fl = 0.5 + 0.5 * Math.sin(now * 6 + i)
          ctx.fillStyle = `rgba(255,${90 + fl * 60},40,0.5)`
          ctx.beginPath()
          ctx.arc(fx, H * 0.86, H * 0.03 * fl, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.fillStyle = '#0b050a'
        for (const z of horde) {
          const x = (z.x + t * 0.15) * W
          const y = z.y * H
          const bob = Math.sin(now * 3 + z.ph) * 2
          ctx.fillRect(x - 2, y - z.s + bob, 4, z.s)
          ctx.beginPath()
          ctx.arc(x, y - z.s + bob, 3, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      if (ci === 2) {
        // beacon beam + rain
        ctx.save()
        ctx.translate(W * 0.82, baseY - H * 0.2)
        ctx.rotate(-0.5 + Math.sin(now * 0.6) * 0.3)
        const g = ctx.createLinearGradient(0, 0, W, 0)
        g.addColorStop(0, 'rgba(200,235,255,0.5)')
        g.addColorStop(1, 'rgba(200,235,255,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, -H * 0.1, W, H * 0.2)
        ctx.restore()
        ctx.strokeStyle = 'rgba(150,180,210,0.25)'
        for (const d of rain) {
          const x = ((d.x + now * 0.05 * d.sp) % 1) * W
          const y = ((d.y + now * 0.6 * d.sp) % 1) * H
          ctx.beginPath()
          ctx.moveTo(x, y)
          ctx.lineTo(x - 2, y + 12)
          ctx.stroke()
        }
      }
      if (ci === 3) {
        // embers + title
        for (const e of embers) {
          const y = (H - ((e.y * H + now * e.v * 60) % H))
          ctx.fillStyle = 'rgba(255,120,60,0.7)'
          ctx.fillRect(e.x * W, y, 2, 2)
        }
        const a = Math.min(1, Math.max(0, (t - 0.28) / 0.2))
        ctx.save()
        ctx.globalAlpha = a
        ctx.textAlign = 'center'
        ctx.font = `900 ${Math.min(W, H) * 0.07}px Orbitron, sans-serif`
        ctx.fillStyle = '#fff'
        ctx.shadowColor = 'rgba(77,231,255,0.9)'
        ctx.shadowBlur = 24
        ctx.fillText('VOXEL SURVIVOR', W / 2, H * 0.36)
        ctx.restore()
        if (t > 0.9) {
          ctx.fillStyle = `rgba(0,0,0,${(t - 0.9) / 0.1})`
          ctx.fillRect(0, 0, W, H)
        }
      }
      // letterbox + grain
      ctx.fillStyle = '#000'
      ctx.fillRect(0, 0, W, H * 0.08)
      ctx.fillRect(0, H * 0.92, W, H * 0.08)
      // typewriter
      if (typeStart < 0 && elapsed > 0.3) typeStart = ms
      if (typeStart >= 0) {
        const n = Math.floor(((ms - typeStart) / 850) * ch.sub.length)
        const txt = ch.sub.slice(0, n)
        setSub((s) => (s === txt ? s : txt))
      }
      setProg((elapsed / ch.dur) * 100)
      if (elapsed >= ch.dur) next()
    }
    audio.tone(680, 0.1, 'square', 0.04, 220)
    nextRef.current = next
    raf = requestAnimationFrame(frame)
    return () => {
      running = false
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="absolute inset-0 z-30 bg-black" onClick={() => nextRef.current()}>
      <canvas ref={ref} className="h-full w-full" />
      <div className="pointer-events-none absolute inset-x-0 top-[12%] text-center">
        <div className="font-display text-xs tracking-[4px] text-accent">{CHAPTERS[idx].key}</div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-[14%] text-center font-ui text-lg text-txt">{sub}</div>
      <div className="absolute inset-x-0 bottom-[10%] mx-auto h-1 w-2/3 overflow-hidden rounded bg-white/10">
        <div className="h-full bg-accent" style={{ width: `${prog}%` }} />
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); done.current() }}
        className="absolute right-4 top-4 rounded-panel bg-surface px-3 py-1 font-display text-xs text-dim"
      >
        SKIP
      </button>
    </div>
  )
}
