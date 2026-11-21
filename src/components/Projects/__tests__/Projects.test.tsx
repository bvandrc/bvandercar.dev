import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { PROJECTS } from '@/generated/profile/content/projects'
import { getAnchorId } from '@/lib/anchor-id'
import { renderWithProviders } from '@/test-helpers/render'
import { SELECTORS } from '~/test-support/selectors'
import { Projects } from '../Projects'

const { TOGGLE } = SELECTORS.LIVE_PREVIEW
const { CARD, COUNTS } = SELECTORS.PROJECTS

// The first card, whose counts the URL names.
const TARGET_ID = getAnchorId(PROJECTS[0].projects[0].name)

/** The card with the id `id`. */
const getCardById = (id: string) => {
  const card = screen.getAllByTestId(CARD).find((element) => element.id === id)
  if (!card) {
    throw new Error(`No card has the id ${id}`)
  }
  return card
}

const getPulses = () =>
  screen.getAllByTestId(TOGGLE).map((toggle) => toggle.dataset.pulse)

describe('Projects', () => {
  it('pulses every preview toggle until any one is opened', async () => {
    const user = userEvent.setup()
    renderWithProviders(<Projects urlTargetId={undefined} />)
    // More than one, or stopping "the others" would prove nothing.
    expect(getPulses().length).toBeGreaterThan(1)
    expect(new Set(getPulses())).toEqual(new Set(['true']))

    await user.click(screen.getAllByTestId(TOGGLE)[0])
    expect(new Set(getPulses())).toEqual(new Set(['false']))
  })

  it('pulses again on a new visit', async () => {
    const user = userEvent.setup()
    const { unmount } = renderWithProviders(
      <Projects urlTargetId={undefined} />
    )
    await user.click(screen.getAllByTestId(TOGGLE)[0])
    unmount()

    renderWithProviders(<Projects urlTargetId={undefined} />)
    expect(new Set(getPulses())).toEqual(new Set(['true']))
  })

  describe("opening a card's counts from the URL", () => {
    afterEach(() => {
      window.history.replaceState(null, '', '/')
    })

    it('opens the tooltip of the card the page landed on, where the URL asks for its charts', async () => {
      window.history.replaceState(null, '', `/?charts#${TARGET_ID}`)
      renderWithProviders(<Projects urlTargetId={TARGET_ID} />)

      await waitFor(() =>
        expect(
          within(getCardById(TARGET_ID))
            .getByTestId(COUNTS)
            .getAttribute('aria-describedby')
        ).toBe(screen.getByRole('tooltip').id)
      )
      // That card's alone.
      expect(screen.getAllByRole('tooltip')).toHaveLength(1)
    })

    it('opens none for a URL naming the card alone', () => {
      window.history.replaceState(null, '', `/#${TARGET_ID}`)
      renderWithProviders(<Projects urlTargetId={TARGET_ID} />)
      expect(screen.queryByRole('tooltip')).toBeNull()
    })
  })
})
