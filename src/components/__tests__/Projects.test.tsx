import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { renderWithProviders } from '@/test-helpers/render'
import { SELECTORS } from '~/test-support/selectors'
import { Projects } from '../Projects'

const { LIVE_PREVIEW, PROJECTS } = SELECTORS
const { TOGGLE } = LIVE_PREVIEW

const getPreviewCard = () => {
  const card = screen
    .getAllByTestId(PROJECTS.CARD)
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

    await user.click(within(card).getByTestId(PROJECTS.REPO_LINK))
    expect(within(card).queryByTestId(LIVE_PREVIEW.FRAME)).toBeNull()

    // Toggled once by the toggle, not back again by the card around it.
    await user.click(within(card).getByTestId(TOGGLE))
    expect(within(card).getByTestId(LIVE_PREVIEW.FRAME)).toBeDefined()
  })
})
