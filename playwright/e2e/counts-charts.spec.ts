import { expect, type Locator, type Page, test } from '@playwright/test'

import { SELECTORS } from '~/test-support/selectors'
import { getChartedCounts, getChartedRepoLink } from '../support/charted-counts'

const { LINE_CHART } = SELECTORS
const { CARD, COUNTS, COMMITS_CHART, DOWNLOADS_CHART } = SELECTORS.PROJECTS

/** Waits two frames, for what a state change rendered to show. */
const waitForFrames = (page: Page) =>
  page.evaluate(
    () =>
      new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve))
      )
  )

/**
 * Asserts the card with `id` has scrolled into view with its counts' charts
 * open, past the scroll to it, which closes a tooltip opened before it.
 */
const expectChartsOpenOn = async (page: Page, id: string) => {
  const card = page.locator(`#${id}`)
  await expect(card).toBeInViewport()
  await waitForFrames(page)
  // Its trigger says it's closed at once, where a closed tooltip lingers
  // through its fade-in.
  await expect(card.getByTestId(COUNTS)).toHaveAttribute('data-state', /open$/)
  const tooltip = page.getByTestId(SELECTORS.TOOLTIP)
  await expect(tooltip.getByTestId(COMMITS_CHART)).toBeVisible()
  await expect(tooltip.getByTestId(DOWNLOADS_CHART)).toBeVisible()
}

/** Moves the pointer onto the middle of a chart's plot. */
const hoverPlot = async (page: Page, chart: Locator) => {
  const plot = await chart.getByTestId(LINE_CHART.PLOT).boundingBox()
  if (!plot) {
    throw new Error('The chart has no box')
  }
  await page.mouse.move(plot.x + plot.width / 2, plot.y + plot.height / 2, {
    steps: 10,
  })
}

test("hovering a project's counts charts its commits and npm downloads as running totals, read out week by week", async ({
  page,
}) => {
  await page.goto('/')

  const counts = getChartedCounts(page)
  await counts.hover()
  const tooltip = page.getByTestId(SELECTORS.TOOLTIP)
  const activity = tooltip.getByTestId(COMMITS_CHART)
  const downloads = tooltip.getByTestId(DOWNLOADS_CHART)
  // Each chart ends at the count its glyph shows, shortened the same way:
  // the fetched totals and histories agree, which fixtures can't show.
  for (const chart of [activity, downloads]) {
    const total = await chart.getByTestId(LINE_CHART.END_LABEL).textContent()
    await expect(counts).toContainText(total ?? '')
  }

  // The tooltip stays open as the pointer crosses into it, and between charts.
  await hoverPlot(page, activity)
  await expect(activity.getByTestId(LINE_CHART.CAPTION)).toHaveText(
    /^Through .+: [\d,]+ commits?$/
  )
  await hoverPlot(page, downloads)
  await expect(downloads.getByTestId(LINE_CHART.CAPTION)).toHaveText(
    /^Through .+: [\d,]+ downloads?$/
  )
})

test("the wheel zooms both of a project's charts around the pointer, without scrolling the page", async ({
  page,
}) => {
  await page.goto('/')

  await getChartedCounts(page).hover()
  const tooltip = page.getByTestId(SELECTORS.TOOLTIP)
  const totals = tooltip.getByTestId(LINE_CHART.END_LABEL)
  await expect(totals).toHaveCount(2)
  const scrollY = await page.evaluate(() => window.scrollY)

  await hoverPlot(page, tooltip.getByTestId(COMMITS_CHART))
  await page.mouse.wheel(0, -600)
  // Zoomed in around the middle, short of the lines' ends and their totals.
  await expect(totals).toHaveCount(0)
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollY)

  await page.mouse.wheel(0, 2000)
  await expect(totals).toHaveCount(2)
})

/** The id of the card whose counts `getChartedRepoLink` charts. */
const getChartedCardId = async (page: Page) => {
  const id = await page
    .getByTestId(CARD)
    .filter({ has: getChartedRepoLink(page) })
    .getAttribute('id')
  if (!id) {
    throw new Error('The charted card has no id')
  }
  return id
}

test('a URL whose `#` names a card, and asks for its charts, opens on the card with its counts charted', async ({
  page,
}) => {
  await page.goto('/')
  const id = await getChartedCardId(page)

  // A fresh load, where going from one `#` to another wouldn't reload.
  await page.goto('about:blank')
  await page.goto(`/#${id}?show_charts=true`)
  await expectChartsOpenOn(page, id)
})

test("changing the page's `#` to ask for a card's charts scrolls to it and opens them, with no reload", async ({
  page,
}) => {
  await page.goto('/')
  const id = await getChartedCardId(page)

  await page.evaluate((cardId) => {
    window.location.hash = `${cardId}?show_charts=true`
  }, id)
  await expectChartsOpenOn(page, id)
})
