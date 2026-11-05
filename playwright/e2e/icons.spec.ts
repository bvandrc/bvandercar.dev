import { expect, test } from '@playwright/test'

// Icons, the manifest, and the social preview live in <head> and the
// manifest, where nothing renders them, so a bad path would only show up as a
// missing icon in production.
test('icons, manifest, and social preview resolve', async ({
  page,
  request,
}) => {
  await page.goto('/')

  const headUrls = await page
    .locator(
      'link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="manifest"]'
    )
    .evaluateAll((links: HTMLLinkElement[]) => links.map(({ href }) => href))
  expect(headUrls).toHaveLength(4)

  const manifestUrl = new URL('site.webmanifest', page.url())
  const manifest: { icons: { src: string }[] } = await (
    await request.get(manifestUrl.href)
  ).json()
  const manifestIconUrls = manifest.icons.map(
    ({ src }) => new URL(src, manifestUrl).href
  )

  // The deployed og:image URL points at production, so check its local copy.
  const previewUrl = new URL('preview.png', page.url()).href

  for (const url of [...headUrls, ...manifestIconUrls, previewUrl]) {
    const response = await request.get(url)
    expect(response.status(), url).toBe(200)
  }
})
