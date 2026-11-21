import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { mockPressFocus } from '@/test-helpers/focus-visible'
import { renderWithProviders } from '@/test-helpers/render'
import { turnWheel } from '@/test-helpers/wheel'
import type { ActivityHistory, Release } from '~/counts'
import { SELECTORS } from '~/test-support/selectors'
import { Counts, type CountsCharts, type CountsProps } from '../Counts'

const { COUNTS, COMMITS_CHART, CHARTS_LOADING } = SELECTORS.PROJECTS
const { TOOLTIP } = SELECTORS
const { PLOT, MARKER } = SELECTORS.LINE_CHART

const SHOWN = [
  { key: 'commits', icon: 'git-commit', noun: 'commit', count: 55 },
  { key: 'downloads', icon: 'download', noun: 'download', count: 3120 },
] satisfies CountsProps['shown']

// The counts in full, as their name.
const LABEL = '55 commits, 3,120 downloads'

// 3, 40, then 12 commits a week from Monday, Feb 23, then quiet to Mar 26.
const ACTIVITY = {
  firstDay: '2026-02-23',
  lastDay: '2026-03-26',
  commits: [
    1, 0, 0, 1, 0, 1, 0, 5, 10, 0, 5, 10, 5, 5, 3, 4, 0, 5, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
  ],
  prs: Array.from({ length: 32 }, () => 0),
} satisfies ActivityHistory

const RELEASES = [
  { version: '1.0.0', day: '2026-03-04' },
  { version: '1.1.0', day: '2026-03-12' },
] satisfies Release[]

const CHARTS = {
  activity: ACTIVITY,
  releases: RELEASES,
  span: { start: '2026-03-04', end: '2026-03-26' },
  descriptions: ['Weekly commits since Mar 2026'],
} satisfies CountsCharts

/** Renders `Counts`, or a fresh copy of it, charting `CHARTS`, with `props` in place of any of its own. */
const renderCounts = (
  props?: Partial<CountsProps>,
  CountsComponent: typeof Counts = Counts
) =>
  renderWithProviders(
    <CountsComponent
      shown={SHOWN}
      chartCount={1}
      getCharts={() => CHARTS}
      data-testid={COUNTS}
      {...props}
    />
  )

/** A fresh copy of `Counts`, since the charts, once loaded, are kept for every later one. */
const importFreshCounts = async () => {
  vi.resetModules()
  const { Counts: FreshCounts } = await import('../Counts')
  return FreshCounts
}

/** Hovers the counts, and returns the tooltip once it opens and any charts in it have loaded. */
const hoverCounts = async () => {
  await userEvent.setup().hover(screen.getByTestId(COUNTS))
  const tooltip = await screen.findByTestId(TOOLTIP)
  await waitFor(() => expect(screen.queryByTestId(CHARTS_LOADING)).toBeNull())
  return tooltip
}

/** Records whether each click on the page went on unhandled, as a card or link around the counts would see it. */
const recordClicks = () => {
  const unhandled: boolean[] = []
  // On the document, so React's handlers have had their say first.
  const recordClick = (event: MouseEvent) =>
    unhandled.push(!event.defaultPrevented)
  document.addEventListener('click', recordClick)
  onTestFinished(() => document.removeEventListener('click', recordClick))
  return unhandled
}

describe('Counts', () => {
  it('shows the counts shortened, and in full as the name of a button, which a press toggles the tooltip from', () => {
    renderCounts()
    const counts = screen.getByTestId(COUNTS)

    expect(counts.textContent).toBe('553.1K')
    expect(screen.getByRole('button', { name: LABEL })).toBe(counts)
  })

  it('renders nothing for no counts', () => {
    renderCounts({ shown: [] })

    expect(screen.queryByTestId(COUNTS)).toBeNull()
  })

  it('keeps the counts in words where it may chart nothing, with no charts to load', async () => {
    // A fresh copy, with the charts' module watched for being loaded.
    vi.resetModules()
    const loadCharts = vi.fn()
    vi.doMock('../charts/ProjectCharts', (importOriginal) => {
      loadCharts()
      return importOriginal()
    })
    onTestFinished(() => vi.doUnmock('../charts/ProjectCharts'))
    const { Counts: FreshCounts } = await import('../Counts')
    renderCounts({ chartCount: 0 }, FreshCounts)

    await userEvent.setup().hover(screen.getByTestId(COUNTS))
    expect((await screen.findByTestId(TOOLTIP)).textContent).toBe(LABEL)
    expect(loadCharts).not.toHaveBeenCalled()
  })

  it('charts what getCharts picks in the tooltip, in place of the counts, and describes them in words after them', async () => {
    renderCounts()

    const tooltip = await hoverCounts()
    expect(tooltip.contains(screen.getByTestId(COMMITS_CHART))).toBe(true)
    expect(within(tooltip).queryByText(LABEL)).toBeNull()
    expect(screen.getByRole('tooltip').textContent?.split('. ')).toEqual([
      LABEL,
      'Weekly commits since Mar 2026',
    ])
  })

  it('leaves the counts in words where getCharts picks nothing', async () => {
    renderCounts({ getCharts: () => undefined })

    const tooltip = await hoverCounts()
    expect(tooltip.textContent).toBe(LABEL)
  })

  it('opens from hovering the words beside the glyphs too', async () => {
    renderCounts({ children: <span data-testid="words">all-time</span> })

    await userEvent.setup().hover(screen.getByTestId('words'))
    expect(await screen.findByTestId(COMMITS_CHART)).toBeTruthy()
  })

  it('starts the charts zoomed out each time the tooltip opens', async () => {
    mockPressFocus()
    const user = userEvent.setup()
    renderCounts()
    /** The activity chart's release lines' positions. */
    const getReleaseXs = () =>
      within(screen.getByTestId(COMMITS_CHART))
        .getAllByTestId(MARKER)
        .map((line) => line.getAttribute('x1'))

    await hoverCounts()
    const unzoomed = getReleaseXs()
    turnWheel(
      within(screen.getByTestId(COMMITS_CHART)).getByTestId(PLOT),
      100,
      -300
    )
    expect(getReleaseXs()).not.toEqual(unzoomed)

    // Taps close it, then open it again.
    const counts = screen.getByTestId(COUNTS)
    await user.pointer({ keys: '[TouchA]', target: counts })
    await waitFor(() => expect(screen.queryByTestId(TOOLTIP)).toBeNull())
    await user.pointer({ keys: '[TouchA]', target: counts })
    await screen.findByTestId(TOOLTIP)
    expect(getReleaseXs()).toEqual(unzoomed)
  })

  it('opens from outside its trigger, loading its charts, and still closes as any would', async () => {
    const user = userEvent.setup()
    renderCounts({ open: true }, await importFreshCounts())

    expect(await screen.findByTestId(COMMITS_CHART)).toBeTruthy()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByTestId(TOOLTIP)).toBeNull())
  })

  it('closes on a press after opening from outside its trigger', async () => {
    mockPressFocus()
    const user = userEvent.setup()
    renderCounts({ open: true })

    await screen.findByTestId(TOOLTIP)
    await user.pointer({ keys: '[TouchA]', target: screen.getByTestId(COUNTS) })
    await waitFor(() => expect(screen.queryByTestId(TOOLTIP)).toBeNull())
  })

  describe('on a press', () => {
    it('opens and closes the tooltip with a tap, which goes no further', async () => {
      mockPressFocus()
      const user = userEvent.setup()
      const unhandled = recordClicks()
      renderCounts()
      const counts = screen.getByTestId(COUNTS)

      await user.pointer({ keys: '[TouchA]', target: counts })
      expect(await screen.findByTestId(TOOLTIP)).toBeTruthy()
      await user.pointer({ keys: '[TouchA]', target: counts })
      await waitFor(() => expect(screen.queryByTestId(TOOLTIP)).toBeNull())
      expect(unhandled).toEqual([false, false])
    })

    it('keeps the tooltip hover opened on a click, and closes it on the next, which go no further', async () => {
      mockPressFocus()
      const user = userEvent.setup()
      const unhandled = recordClicks()
      renderCounts()
      const counts = screen.getByTestId(COUNTS)

      await user.hover(counts)
      await screen.findByTestId(TOOLTIP)
      await user.click(counts)
      expect(screen.getByTestId(TOOLTIP)).toBeTruthy()
      await user.click(counts)
      await waitFor(() => expect(screen.queryByTestId(TOOLTIP)).toBeNull())
      expect(unhandled).toEqual([false, false])
    })

    it('opens the tooltip on keyboard focus, as a tab stop of their own, loading its charts', async () => {
      const user = userEvent.setup()
      renderCounts(undefined, await importFreshCounts())

      await user.tab()
      expect(document.activeElement).toBe(screen.getByTestId(COUNTS))
      // With no hover or press before it to start them loading.
      expect(await screen.findByTestId(COMMITS_CHART)).toBeTruthy()
    })
  })

  describe('in a link', () => {
    /** Renders the counts in a link, and returns the link. */
    const renderInLink = () => {
      renderWithProviders(
        <a href="#projects" data-testid="link">
          <Counts
            shown={SHOWN}
            chartCount={1}
            getCharts={() => CHARTS}
            inLink
            data-testid={COUNTS}
          />
        </a>
      )
      return screen.getByTestId('link')
    }

    it('opens and closes the tooltip with a tap, rather than following the link', async () => {
      const user = userEvent.setup()
      const unhandled = recordClicks()
      renderInLink()
      const counts = screen.getByTestId(COUNTS)

      await user.pointer({ keys: '[TouchA]', target: counts })
      expect(await screen.findByTestId(TOOLTIP)).toBeTruthy()
      await user.pointer({ keys: '[TouchA]', target: counts })
      await waitFor(() => expect(screen.queryByTestId(TOOLTIP)).toBeNull())
      expect(unhandled).toEqual([false, false])
    })

    it('follows the link on a mouse click', async () => {
      const unhandled = recordClicks()
      renderInLink()

      await userEvent.setup().click(screen.getByTestId(COUNTS))
      expect(unhandled).toEqual([true])
    })

    it("shows the counts as an image, not a button, which the link can't hold", () => {
      renderInLink()

      expect(screen.getByRole('img', { name: LABEL })).toBeDefined()
      expect(screen.queryByRole('button')).toBeNull()
    })
  })
})
