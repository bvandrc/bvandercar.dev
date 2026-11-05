import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

import { BASE_PATH, SECURITY_HEADERS } from './site.config'
import { webAssets } from './vite-plugins/web-assets'

/** Writes `SECURITY_HEADERS` to `dist/_headers`, which Cloudflare applies to every path. */
const securityHeadersFile = (): Plugin => ({
  name: 'security-headers-file',
  apply: 'build',
  generateBundle() {
    const lines = Object.entries(SECURITY_HEADERS).map(
      ([name, value]) => `  ${name}: ${value}`
    )
    this.emitFile({
      type: 'asset',
      fileName: '_headers',
      source: ['/*', ...lines, ''].join('\n'),
    })
  },
})

export default defineConfig(() => ({
  base: BASE_PATH,
  // Unknown paths 404 instead of falling back to index.html, as on Cloudflare.
  // Lighthouse probes `/.well-known/` files and fails on an HTML 200.
  appType: 'mpa' as const,
  plugins: [tailwindcss(), react(), securityHeadersFile(), webAssets()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
  } as const,
  // Only preview: the dev server's HMR runs inline scripts the CSP would block.
  preview: {
    headers: SECURITY_HEADERS,
  },
  build: {
    target: 'esnext',
    modulePreload: false,
  },
}))
