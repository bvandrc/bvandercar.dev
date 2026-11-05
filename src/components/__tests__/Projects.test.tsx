import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TYPE_ICONS } from '@/generated/profile/content/project-types'
import { PROJECTS } from '@/generated/profile/content/projects'
import { renderWithProviders } from '@/test-helpers/render'
import { SELECTORS } from '~/test-support/selectors'
import { Projects } from '../Projects'

const { TOGGLE } = SELECTORS.LIVE_PREVIEW
const { CARD } = SELECTORS.PROJECTS

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
})
