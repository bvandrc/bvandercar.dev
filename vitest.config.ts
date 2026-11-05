import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    // The tsconfig path aliases, which vite.config.ts resolves for the build.
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
      '~/test-support': resolve(import.meta.dirname, 'shared/test-support'),
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
    include: ['./src/**/*.{test,spec}.*'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/playwright/**'],
  },
})
