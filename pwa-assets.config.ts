import {
  defineConfig,
  minimal2023Preset,
} from '@vite-pwa/assets-generator/config'

// Mirrors the canvas theme token in src/styles/index.css.
const CANVAS_COLOR = '#090c13'

/** Generates favicon.ico and the touch and manifest PNGs from the SVG favicon. */
export default defineConfig({
  images: ['public/favicon.svg'],
  logLevel: 'silent',
  manifestIconsEntry: false,
  preset: {
    ...minimal2023Preset,
    // The favicon's tile is already the icon's background, so no padding.
    transparent: { ...minimal2023Preset.transparent, padding: 0 },
    // iOS and Android mask these to their own shape; the canvas color fills
    // behind the tile's rounded corners so the mask sees one solid tile.
    apple: {
      sizes: [180],
      padding: 0,
      resizeOptions: { background: CANVAS_COLOR },
    },
    maskable: {
      sizes: [512],
      resizeOptions: { background: CANVAS_COLOR },
    },
  },
})
