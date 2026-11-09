import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

import { iconsPlugin } from './scripts/icons-plugin'

export default defineConfig({
  plugins: [iconsPlugin()],
  resolve: {
    // The tsconfig path aliases, which vite.config.ts resolves for the build.
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
      '~': resolve(import.meta.dirname, 'shared'),
    },
  },
  test: {
    // A spy declared once for a `describe` starts each case empty, so a
    // `toHaveBeenCalledWith` cannot pass on a call from the case before it.
    clearMocks: true,
    environment: 'happy-dom',
    globals: true,
    watch: false,
    root: '.',
    include: ['./src/**/*.{test,spec}.*', './__tests__/*.{test,spec}.*'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/playwright/**'],
  },
})
