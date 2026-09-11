import * as THREE from 'three'

// Port of js/textures.js:1 — CanvasTexture generators, memoized.
// Modern three: set colorSpace SRGB for albedo textures.

function tex(w: number, h: number, fn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!
  fn(ctx, w, h)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.magFilter = THREE.NearestFilter
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

let _crate: THREE.CanvasTexture | null = null
let _groundA: THREE.CanvasTexture | null = null
let _groundB: THREE.CanvasTexture | null = null
let _rock: THREE.CanvasTexture | null = null
let _flesh: THREE.CanvasTexture | null = null
let _metal: THREE.CanvasTexture | null = null
let _glow: THREE.CanvasTexture | null = null
let _sky: THREE.CanvasTexture | null = null

export function crateTexture(): THREE.CanvasTexture {
  if (_crate) return _crate
  _crate = tex(128, 128, (ctx, w, h) => {
    const rows = 4
    for (let r = 0; r < rows; r++) {
      ctx.fillStyle = r % 2 ? '#6b4a2b' : '#57371f'
      ctx.fillRect(0, (r * h) / rows, w, h / rows)
    }
    ctx.strokeStyle = 'rgba(24,14,6,0.85)'
    ctx.lineWidth = 2
    for (let r = 1; r < rows; r++) {
      ctx.beginPath(); ctx.moveTo(0, (r * h) / rows); ctx.lineTo(w, (r * h) / rows); ctx.stroke()
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'
    ctx.lineWidth = 1
    for (let x = 1; x < 4; x++) {
      ctx.beginPath(); ctx.moveTo((x * w) / 4, 0); ctx.lineTo((x * w) / 4, h); ctx.stroke()
    }
    ctx.fillStyle = '#26262b'
    for (let r = 0; r < rows; r++)
      for (let x = 0; x < 3; x++) {
        ctx.beginPath()
        ctx.arc(w * 0.14 + (x * w * 0.36), (r * h) / rows + ((h / rows) * 0.5), 2.5, 0, Math.PI * 2)
        ctx.fill()
      }
    for (let i = 0; i < 500; i++) {
      ctx.fillStyle = 'rgba(16,10,4,' + Math.random() * 0.3 + ')'
      ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3)
    }
  })
  return _crate
}

export function groundTexture(a: boolean): THREE.CanvasTexture {
  const cached = a ? _groundA : _groundB
  if (cached) return cached
  const t = tex(64, 64, (ctx, w, h) => {
    ctx.fillStyle = a ? '#2c3b28' : '#33472d'
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '50,80,42' : '20,32,18') + ',' + Math.random() * 0.5 + ')'
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2)
    }
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = 'rgba(90,120,60,0.25)'
      ctx.fillRect(Math.random() * w, Math.random() * h, 6, 2)
    }
  })
  if (a) _groundA = t
  else _groundB = t
  return t
}

export function rockTexture(): THREE.CanvasTexture {
  if (_rock) return _rock
  _rock = tex(64, 64, (ctx, w, h) => {
    ctx.fillStyle = '#5e6367'
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 300; i++) {
      ctx.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '120,125,130' : '40,44,48') + ',' + Math.random() * 0.4 + ')'
      ctx.fillRect(Math.random() * w, Math.random() * h, 3, 2)
    }
  })
  return _rock
}

export function fleshTexture(): THREE.CanvasTexture {
  if (_flesh) return _flesh
  _flesh = tex(64, 64, (ctx, w, h) => {
    ctx.fillStyle = '#71805a'
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 700; i++) {
      ctx.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '40,58,34' : '120,140,95') + ',' + Math.random() * 0.4 + ')'
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2)
    }
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = 'rgba(20,30,16,0.35)'
      ctx.beginPath()
      ctx.arc(Math.random() * w, Math.random() * h, 1.5 + Math.random() * 2, 0, Math.PI * 2)
      ctx.fill()
    }
  })
  return _flesh
}

export function metalTexture(): THREE.CanvasTexture {
  if (_metal) return _metal
  _metal = tex(64, 64, (ctx, w, h) => {
    ctx.fillStyle = '#33363c'
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < 320; i++) {
      ctx.fillStyle = 'rgba(' + (Math.random() < 0.5 ? '255,255,255' : '0,0,0') + ',' + Math.random() * 0.14 + ')'
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 1)
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'
    ctx.lineWidth = 2
    ctx.strokeRect(2, 2, w - 4, h - 4)
    ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke()
  })
  return _metal
}

export function glowTexture(): THREE.CanvasTexture {
  if (_glow) return _glow
  _glow = tex(64, 64, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
    g.addColorStop(0, 'rgba(255,255,255,1)')
    g.addColorStop(0.35, 'rgba(255,220,120,0.85)')
    g.addColorStop(1, 'rgba(255,150,50,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  })
  return _glow
}

export function skyTexture(): THREE.CanvasTexture {
  if (_sky) return _sky
  const c = document.createElement('canvas')
  c.width = 2
  c.height = 512
  const ctx = c.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 0, 512)
  g.addColorStop(0, '#1a2c44')
  g.addColorStop(0.45, '#24374e')
  g.addColorStop(0.8, '#141e2a')
  g.addColorStop(1, '#0a0f16')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 2, 512)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.magFilter = THREE.LinearFilter
  t.colorSpace = THREE.SRGBColorSpace
  _sky = t
  return _sky
}
