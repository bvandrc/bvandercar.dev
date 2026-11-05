import type { Page } from '@playwright/test'

/** What every framed page shows in place of the real site. */
export const MOCK_FRAMED_PAGE_TEXT = 'Framed page'

/**
 * Serves a minimal page in place of every page loaded in a frame.
 *
 * Keeps the suites off the live project sites, and keeps their markup out of
 * the accessibility scans. The CSP still applies, since it blocks a frame
 * before it requests anything.
 */
export const mockFramedPages = (page: Page) =>
  page.route('**/*', (route) => {
    const request = route.request()
    if (
      request.resourceType() !== 'document' ||
      request.frame() === page.mainFrame()
    ) {
      return route.fallback()
    }
    // No heading or landmark, which axe would count as the host page's own.
    return route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><html lang="en"><head><title>${MOCK_FRAMED_PAGE_TEXT}</title></head><body><p>${MOCK_FRAMED_PAGE_TEXT}</p></body></html>`,
    })
  })
