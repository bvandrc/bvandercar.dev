/**
 * Renders the raster icons and social preview from their SVG sources.
 *
 * Run with `pnpm icons` after changing `public/favicon.svg` or
 * `design/preview.svg`, and commit what it writes to `public/`.
 */

import { readFile, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const FAVICON_SVG = await readFile('public/favicon.svg', 'utf8')
const PREVIEW_SVG = await readFile('design/preview.svg', 'utf8')

// iOS and Android mask icons to their own shape, so those get square corners.
const SQUARE_SVG = FAVICON_SVG.replace(' rx="14"', '')
// A maskable icon's mark must sit inside the central 80% circle that survives
// any mask shape, so the mark shrinks while the background still fills.
const MASKABLE_SVG = SQUARE_SVG.replace(
  /(<rect[^>]*\/>)([\s\S]*)(<\/svg>)/,
  '$1<g transform="translate(32 32) scale(0.75) translate(-32 -32)">$2</g>$3'
)

const ICO_SIZES = [16, 32, 48]

const browser = await chromium.launch()
const page = await browser.newPage()

const renderPng = async (svg, width, height = width) => {
  await page.setViewportSize({ width, height })
  await page.setContent(
    `<style>*{margin:0}svg{display:block;width:100vw;height:100vh}</style>${svg}`
  )
  return page.screenshot({ omitBackground: true })
}

/** Packs PNGs into an .ico, which may hold PNG data directly since Vista. */
const buildIco = (pngs) => {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(1, 2) // type: icon
  header.writeUInt16LE(pngs.length, 4)

  let offset = header.length + pngs.length * 16
  const entries = pngs.map(({ size, data }) => {
    const entry = Buffer.alloc(16)
    // A size of 256 is written as 0; ours are all smaller.
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

const icoPngs = []
for (const size of ICO_SIZES) {
  icoPngs.push({ size, data: await renderPng(FAVICON_SVG, size) })
}

const outputs = {
  'public/favicon.ico': buildIco(icoPngs),
  'public/apple-touch-icon.png': await renderPng(SQUARE_SVG, 180),
  'public/icon-192.png': await renderPng(FAVICON_SVG, 192),
  'public/icon-512.png': await renderPng(FAVICON_SVG, 512),
  'public/icon-maskable-512.png': await renderPng(MASKABLE_SVG, 512),
  'public/preview.png': await renderPng(PREVIEW_SVG, 1200, 630),
}

await browser.close()

for (const [path, data] of Object.entries(outputs)) {
  await writeFile(path, data)
  console.log(`wrote ${path}`)
}
