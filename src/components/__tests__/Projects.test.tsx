import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TYPE_ICONS } from '@/generated/profile/content/project-types'
import { PROJECTS } from '@/generated/profile/content/projects'
import { REPO_COUNTS } from '@/generated/profile/repo-counts'
import { formatCompactCount, formatCount } from '@/lib/format-count'
import { renderWithProviders } from '@/test-helpers/render'
import { SELECTORS } from '~/test-support/selectors'
import { Projects } from '../Projects'

const { LIVE_PREVIEW, TOOLTIP } = SELECTORS
const { TOGGLE } = LIVE_PREVIEW
const { CARD, REPO_LINK, COUNTS } = SELECTORS.PROJECTS

const getPreviewCard = () => {
  const card = screen
    .getAllByTestId(CARD)
    .find((each) => within(each).queryByTestId(TOGGLE))
  if (!card) {
    throw new Error('No project card has a live preview')
  }
  return card
}

const getPulses = () =>
  screen.getAllByTestId(TOGGLE).map((toggle) => toggle.dataset.pulse)

describe('Projects', () => {
  it('pulses every preview toggle until any one is opened', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Projects />)
    // More than one, or stopping "the others" would prove nothing.
    expect(getPulses().length).toBeGreaterThan(1)
    expect(new Set(getPulses())).toEqual(new Set(['true']))

    await user.click(screen.getAllByTestId(TOGGLE)[0])
    expect(new Set(getPulses())).toEqual(new Set(['false']))
  })

  it('pulses again on a new visit', async () => {
    const user = userEvent.setup()
    const { unmount } = renderWithProviders(<Projects />)
    await user.click(screen.getAllByTestId(TOGGLE)[0])
    unmount()

    renderWithProviders(<Projects />)
    expect(new Set(getPulses())).toEqual(new Set(['true']))
  })

  it("names each project's type icon for screen readers", () => {
    renderWithProviders(<Projects />)
    const projects = PROJECTS.flatMap((group) => group.projects)
    const cards = screen.getAllByTestId(CARD)
    expect(cards).toHaveLength(projects.length)
    for (const [index, { name, type }] of projects.entries()) {
      const icon = within(cards[index]).queryByRole('img', {
        name: TYPE_ICONS[type].title,
      })
      expect(icon, name).not.toBeNull()
    }
  })

  it("shows a project's counts shortened, and in full as its name and tooltip", async () => {
    const user = userEvent.setup()
    renderWithProviders(<Projects />)
    // A project with downloads in the thousands, so they're shortened.
    const projects = PROJECTS.flatMap((group) => group.projects)
    const index = projects.findIndex(
      ({ repo }) => (REPO_COUNTS[repo]?.downloads ?? 0) >= 1000
    )
    const repoCounts = REPO_COUNTS[projects[index]?.repo ?? '']
    if (!repoCounts?.downloads) {
      throw new Error('No project has downloads in the thousands')
    }
    const { commits, prs, downloads } = repoCounts
    const card = screen.getAllByTestId(CARD)[index]
    const counts = within(card).getByTestId(COUNTS)
    const LABEL = [
      formatCount(commits, 'commit'),
      formatCount(prs, 'PR'),
      formatCount(downloads, 'download'),
    ].join(', ')

    // Part of the one link to the repo, not a tab stop of its own.
    expect(within(card).getByTestId(REPO_LINK).contains(counts)).toBe(true)
    expect(counts.textContent).toContain(formatCompactCount(downloads))
    expect(counts.textContent).not.toContain('download')
    expect(counts.getAttribute('aria-label')).toBe(LABEL)
    await user.hover(counts)
    expect((await screen.findByTestId(TOOLTIP)).textContent).toBe(LABEL)
  })

  it('shows the repo tooltip on keyboard focus of the repo link, not on a click', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Projects />)
    const link = screen.getAllByTestId(REPO_LINK)[0]
    // jsdom can't open a link's new tab, so keep it from trying.
    link.addEventListener('click', (event) => event.preventDefault())

    await user.click(link)
    expect(document.activeElement).toBe(link)
    expect(screen.queryByTestId(TOOLTIP)).toBeNull()

    await user.tab()
    await user.tab({ shift: true })
    expect(document.activeElement).toBe(link)
    expect((await screen.findByTestId(TOOLTIP)).textContent).toBe(
      'GitHub Repository'
    )
  })

  it('toggles a live preview on a click on its card', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Projects />)
    const card = getPreviewCard()

    await user.click(card)
    expect(within(card).getByTestId(LIVE_PREVIEW.FRAME)).toBeDefined()
    // Clicking the card opened one, so the toggles stop pulsing as they would for the toggle.
    expect(new Set(getPulses())).toEqual(new Set(['false']))

    await user.click(card)
    expect(within(card).queryByTestId(LIVE_PREVIEW.FRAME)).toBeNull()
  })

  it("leaves a live preview as is on a click on its card's links or toggle", async () => {
    const user = userEvent.setup()
    renderWithProviders(<Projects />)
    const card = getPreviewCard()
    // jsdom can't open a link's new tab, so keep it from trying.
    card.addEventListener('click', (event) => {
      if (event.target instanceof Element && event.target.closest('a')) {
        event.preventDefault()
      }
    })

    await user.click(within(card).getByTestId(REPO_LINK))
    expect(within(card).queryByTestId(LIVE_PREVIEW.FRAME)).toBeNull()

    // Toggled once by the toggle, not back again by the card around it.
    await user.click(within(card).getByTestId(TOGGLE))
    expect(within(card).getByTestId(LIVE_PREVIEW.FRAME)).toBeDefined()
  })
})
