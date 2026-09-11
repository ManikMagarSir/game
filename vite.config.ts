import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import type { ProxyOptions } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// CORS single point of control: everything cross-origin comes from `.env`
// (see .env for docs). No other file in the repo sets CORS headers.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const allowOrigin = env.CORS_ALLOW_ORIGIN || 'http://127.0.0.1:5173'
  const allowMethods = env.CORS_ALLOW_METHODS || 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
  const allowHeaders = env.CORS_ALLOW_HEADERS || 'Content-Type,Authorization'
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': allowMethods,
    'Access-Control-Allow-Headers': allowHeaders,
  }
  const proxy: Record<string, ProxyOptions> = {}
  if (env.API_PROXY_TARGET) {
    proxy['/api'] = { target: env.API_PROXY_TARGET, changeOrigin: true }
  }

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'Voxel Survivor R3F',
          short_name: 'VoxelSurvivor',
          start_url: '.',
          display: 'standalone',
          background_color: '#1e2330',
          theme_color: '#1e2330',
          icons: [
            { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
            { src: 'icon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        },
      }),
    ],
    server: {
      headers: corsHeaders,
      proxy,
    },
    preview: {
      headers: corsHeaders,
    },
    test: {
      environment: 'node',
      include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    },
  }
})
