/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#1e2330',
        surface: '#262d3d',
        surface2: '#2c3450',
        accent: '#4de7ff',
        accent2: '#ffb347',
        ok: '#3dff7a',
        warn: '#ffd166',
        bad: '#ff4757',
        txt: '#c9d5e8',
        dim: '#8a97ad',
      },
      fontFamily: {
        display: ['Orbitron', 'Arial Black', 'sans-serif'],
        ui: ['Rajdhani', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: { panel: '14px' },
      boxShadow: {
        raised: '-7px -7px 16px rgba(255,255,255,.05), 7px 7px 18px rgba(0,0,0,.5)',
        'raised-sm': '-4px -4px 10px rgba(255,255,255,.04), 4px 4px 12px rgba(0,0,0,.42)',
        inset: 'inset 3px 3px 8px rgba(0,0,0,.5), inset -3px -3px 8px rgba(255,255,255,.04)',
        'inset-sm': 'inset 2px 2px 5px rgba(0,0,0,.45), inset -2px -2px 5px rgba(255,255,255,.03)',
      },
    },
  },
  plugins: [],
}
