import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TYPE_ICONS } from '@/generated/profile/content/project-types'
import { PROJECTS } from '@/generated/profile/content/projects'
import { REPO_COUNTS } from '@/generated/profile/repo-counts'
import { formatCount } from '@/lib/format-count'
import { renderWithProviders } from '@/test-helpers/render'
import { SELECTORS } from '~/test-support/selectors'
import { Projects } from '../Projects'

const { LIVE_PREVIEW } = SELECTORS
const { TOGGLE } = LIVE_PREVIEW
const { CARD, REPO_LINK } = SELECTORS.PROJECTS

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

  it("shows a project's downloads beside its commits and PRs, where it has any", () => {
    renderWithProviders(<Projects />)
    const projects = PROJECTS.flatMap((group) => group.projects)
    const links = screen.getAllByTestId(REPO_LINK)
    // At least one of each, or either branch could go untested.
    const downloads = projects.map(({ repo }) => REPO_COUNTS[repo]?.downloads)
    expect(downloads.some((count) => count === undefined)).toBe(true)
    expect(downloads.some((count) => count !== undefined)).toBe(true)
    for (const [index, { name }] of projects.entries()) {
      const count = downloads[index]
      const text = links[index].textContent
      if (count === undefined) {
        expect(text, name).not.toMatch(/download/)
      } else {
        expect(text, name).toContain(formatCount(count, 'download'))
      }
    }
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
