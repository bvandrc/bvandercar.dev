/**
 * @fileoverview Vite plugin that generates the site's raster icons and web app
 * manifest from the SVG favicon, so no rendered icon is committed.
 */

import { readFile } from 'node:fs/promises'
import { generateHtmlMarkup } from '@vite-pwa/assets-generator/api/generate-html-markup'
import { generateManifestIconsEntry } from '@vite-pwa/assets-generator/api/generate-manifest-icons-entry'
import { instructions } from '@vite-pwa/assets-generator/api/instructions'
import { minimal2023Preset } from '@vite-pwa/assets-generator/presets/minimal-2023'
import type { HtmlTagDescriptor, Plugin } from 'vite'

const FAVICON_SVG_PATH = 'public/favicon.svg'
const MANIFEST_FILE_NAME = 'site.webmanifest'

// Mirrors the canvas theme token in src/styles/index.css.
const CANVAS_COLOR = '#0b0f17'

const MANIFEST = {
  name: 'Blake Vandercar',
  short_name: 'bvandercar',
  description:
    'My personal developer site: skills, projects, and a little about me.',
  start_url: './',
  scope: './',
  display: 'browser',
  background_color: CANVAS_COLOR,
  theme_color: CANVAS_COLOR,
}

const ICON_PRESET = {
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
}

const generateWebAssets = async (base: string) => {
  const faviconSvg = await readFile(FAVICON_SVG_PATH)
  const iconInstructions = await instructions({
    imageResolver: () => faviconSvg,
    imageName: 'favicon.svg',
    preset: ICON_PRESET,
    htmlLinks: { xhtml: false, includeId: false },
    basePath: base,
    resolveSvgName: (name) => name,
  })

  const files = new Map<string, Buffer>()
  const { favicon, transparent, maskable, apple } = iconInstructions
  for (const icon of Object.values({
    ...favicon,
    ...transparent,
    ...maskable,
    ...apple,
  })) {
    // The SVG favicon is already served from public/.
    if (icon.mimeType !== 'image/svg+xml') {
      files.set(icon.name, await icon.buffer())
    }
  }

  const manifest = {
    ...MANIFEST,
    ...generateManifestIconsEntry('object', iconInstructions),
  }
  files.set(MANIFEST_FILE_NAME, Buffer.from(JSON.stringify(manifest, null, 2)))

  const headLinks = [
    ...generateHtmlMarkup(iconInstructions),
    `<link rel="manifest" href="${base}${MANIFEST_FILE_NAME}">`,
  ]

  return { files, headLinks }
}

const CONTENT_TYPES: Record<string, string> = {
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
}

/** Turns a raw `<link …>` string into a tag Vite can inject. */
const toLinkTag = (markup: string): HtmlTagDescriptor => ({
  tag: 'link',
  attrs: Object.fromEntries(
    [...markup.matchAll(/(\w[\w-]*)="([^"]*)"/g)].map(([, name, value]) => [
      name,
      value,
    ])
  ),
  injectTo: 'head',
})

/**
 * Generates the favicon.ico, touch and manifest icons, and web app manifest,
 * and links them from `<head>`.
 *
 * Icons come from `public/favicon.svg` via `@vite-pwa/assets-generator`.
 * `vite build` writes them to `dist`, and the dev server serves them from
 * memory.
 */
export const webAssets = (): Plugin => {
  let base = '/'
  let assets: ReturnType<typeof generateWebAssets> | undefined
  // Generated once per process, on first use.
  const getAssets = () => {
    assets ??= generateWebAssets(base)
    return assets
  }

  return {
    name: 'web-assets',
    configResolved(config) {
      base = config.base
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const { pathname } = new URL(req.url ?? '/', 'http://localhost')
        const name = pathname.slice(base.length)
        const data = (await getAssets()).files.get(name)
        if (!data) {
          next()
          return
        }
        res.setHeader(
          'Content-Type',
          CONTENT_TYPES[name.slice(name.lastIndexOf('.'))]
        )
        res.end(data)
      })
    },
    async transformIndexHtml() {
      return (await getAssets()).headLinks.map(toLinkTag)
    },
    async generateBundle() {
      for (const [fileName, source] of (await getAssets()).files) {
        this.emitFile({ type: 'asset', fileName, source })
      }
    },
  }
}
