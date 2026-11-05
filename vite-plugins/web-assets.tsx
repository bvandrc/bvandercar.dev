/**
 * @fileoverview Vite plugin that generates the site's raster icons, web app
 * manifest, and social preview from SVG, so no rendered image is committed.
 */

import { readFile } from 'node:fs/promises'
import { Resvg } from '@resvg/resvg-js'
import { generateHtmlMarkup } from '@vite-pwa/assets-generator/api/generate-html-markup'
import { generateManifestIconsEntry } from '@vite-pwa/assets-generator/api/generate-manifest-icons-entry'
import { instructions } from '@vite-pwa/assets-generator/api/instructions'
import { minimal2023Preset } from '@vite-pwa/assets-generator/presets/minimal-2023'
import satori from 'satori'
import type { HtmlTagDescriptor, Plugin } from 'vite'

const FAVICON_SVG_PATH = 'public/favicon.svg'
const LOGO_SVG_PATH = 'public/logo.svg'
const MANIFEST_FILE_NAME = 'site.webmanifest'

// Mirrors the theme tokens in src/styles/index.css.
const COLORS = {
  CANVAS: '#0b0f17',
  INK: '#f0f4fa',
  INK_MUTED: '#9fb0c8',
}

const MANIFEST = {
  name: 'Blake Vandercar',
  short_name: 'bvandercar',
  description:
    'My personal developer site: skills, projects, and a little about me.',
  start_url: './',
  scope: './',
  display: 'browser',
  background_color: COLORS.CANVAS,
  theme_color: COLORS.CANVAS,
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
    resizeOptions: { background: COLORS.CANVAS },
  },
  maskable: {
    sizes: [512],
    resizeOptions: { background: COLORS.CANVAS },
  },
}

const readFont = (weight: 400 | 600) =>
  readFile(
    `node_modules/@fontsource/inter/files/inter-latin-${weight}-normal.woff`
  )

const renderPreview = async () => {
  const logoSvg = await readFile(LOGO_SVG_PATH)
  const svg = await satori(
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 48,
        width: '100%',
        height: '100%',
        padding: '0 96px',
        backgroundColor: COLORS.CANVAS,
        fontFamily: 'Inter',
      }}>
      <img
        src={`data:image/svg+xml;base64,${logoSvg.toString('base64')}`}
        width={192}
        height={192}
        alt=""
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 72, fontWeight: 600, color: COLORS.INK }}>
          Blake Vandercar
        </div>
        <div style={{ fontSize: 32, color: COLORS.INK_MUTED }}>
          Software developer · bvandercar.dev
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Inter', data: await readFont(400), weight: 400 },
        { name: 'Inter', data: await readFont(600), weight: 600 },
      ],
    }
  )
  return new Resvg(svg).render().asPng()
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
  files.set('preview.png', await renderPreview())

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
 * Generates the favicon.ico, touch and manifest icons, web app manifest, and
 * social preview, and links them from `<head>`.
 *
 * Icons come from `public/favicon.svg` via `@vite-pwa/assets-generator`; the
 * preview card is laid out with satori around `public/logo.svg`. `vite build`
 * writes them to `dist`, and the dev server serves them from memory.
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
