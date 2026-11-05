/**
 * @fileoverview Vite plugin that renders the site's raster icons and social
 * preview from SVG, so no rendered image is committed.
 */

import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { Resvg } from '@resvg/resvg-js'
import satori from 'satori'
import type { Plugin } from 'vite'

const FAVICON_SVG_PATH = 'public/favicon.svg'
const LOGO_SVG_PATH = 'public/logo.svg'

// Mirrors the theme tokens in src/styles/index.css.
const COLORS = {
  CANVAS: '#0b0f17',
  INK: '#f0f4fa',
  INK_MUTED: '#9fb0c8',
}

const ICO_SIZES = [16, 32, 48]

// Resolves from the project root: Vite bundles its config, which leaves
// `import.meta.url` undefined here.
const require = createRequire(`${process.cwd()}/package.json`)

const readFont = (weight: 400 | 600) =>
  readFile(
    require.resolve(`@fontsource/inter/files/inter-latin-${weight}-normal.woff`)
  )

const renderPng = (svg: string, width: number) =>
  new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng()

/** Packs PNGs into an .ico, which may hold PNG data directly since Vista. */
const buildIco = (pngs: { size: number; data: Buffer }[]) => {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(pngs.length, 4)

  let offset = header.length + pngs.length * 16
  const entries = pngs.map(({ size, data }) => {
    const entry = Buffer.alloc(16)
    // Width and height are one byte each; every size here is under 256.
    entry.writeUInt8(size, 0)
    entry.writeUInt8(size, 1)
    entry.writeUInt16LE(1, 4) // color planes
    entry.writeUInt16LE(32, 6) // bits per pixel
    entry.writeUInt32LE(data.length, 8)
    entry.writeUInt32LE(offset, 12)
    offset += data.length
    return entry
  })

  return Buffer.concat([header, ...entries, ...pngs.map(({ data }) => data)])
}

const renderPreview = async (logoSvg: string) => {
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
        src={`data:image/svg+xml;base64,${Buffer.from(logoSvg).toString('base64')}`}
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
  return renderPng(svg, 1200)
}

/** Renders every generated asset, keyed by its path under the site root. */
const renderWebAssets = async (): Promise<Record<string, Buffer>> => {
  const faviconSvg = await readFile(FAVICON_SVG_PATH, 'utf8')
  const logoSvg = await readFile(LOGO_SVG_PATH, 'utf8')

  // iOS and Android mask icons to their own shape, so those get square corners.
  const squareSvg = faviconSvg.replace(' rx="14"', '')
  // A maskable icon's mark must sit inside the central 80% circle that
  // survives any mask shape, so the mark shrinks while the background fills.
  const maskableSvg = squareSvg.replace(
    /(<rect[^>]*\/>)([\s\S]*)(<\/svg>)/,
    '$1<g transform="translate(32 32) scale(0.75) translate(-32 -32)">$2</g>$3'
  )

  return {
    'favicon.ico': buildIco(
      ICO_SIZES.map((size) => ({ size, data: renderPng(faviconSvg, size) }))
    ),
    'apple-touch-icon.png': renderPng(squareSvg, 180),
    'icon-192.png': renderPng(faviconSvg, 192),
    'icon-512.png': renderPng(faviconSvg, 512),
    'icon-maskable-512.png': renderPng(maskableSvg, 512),
    'preview.png': await renderPreview(logoSvg),
  }
}

const CONTENT_TYPES: Record<string, string> = {
  '.ico': 'image/x-icon',
  '.png': 'image/png',
}

/**
 * Renders the favicon.ico, touch and manifest icons, and social preview
 * from `public/favicon.svg` and `public/logo.svg`.
 *
 * `vite build` writes them to `dist`, and the dev server serves them from
 * memory, so the same URLs work in both.
 */
export const webAssets = (): Plugin => {
  let assets: Promise<Record<string, Buffer>> | undefined
  // Rendered once per process, on first use.
  const getAssets = () => {
    assets ??= renderWebAssets()
    return assets
  }

  return {
    name: 'web-assets',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const { pathname } = new URL(req.url ?? '/', 'http://localhost')
        const name = pathname.slice(server.config.base.length)
        const data = (await getAssets())[name]
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
    async generateBundle() {
      for (const [fileName, source] of Object.entries(await getAssets())) {
        this.emitFile({ type: 'asset', fileName, source })
      }
    },
  }
}
