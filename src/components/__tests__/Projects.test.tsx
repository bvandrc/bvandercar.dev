import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { SELECTORS } from '~/test-support/selectors'
import { Projects } from '../Projects'
import { TooltipProvider } from '../primitives/Tooltip'

const { TOGGLE } = SELECTORS.LIVE_PREVIEW

const renderProjects = () =>
  render(
    <TooltipProvider>
      <Projects />
    </TooltipProvider>
  )

const getPulses = () =>
  screen.getAllByTestId(TOGGLE).map((toggle) => toggle.dataset.pulse)

describe('Projects', () => {
  it('pulses every preview toggle until any one is opened', async () => {
    const user = userEvent.setup()
    renderProjects()
    // More than one, or stopping "the others" would prove nothing.
    expect(getPulses().length).toBeGreaterThan(1)
    expect(new Set(getPulses())).toEqual(new Set(['true']))

    await user.click(screen.getAllByTestId(TOGGLE)[0])
    expect(new Set(getPulses())).toEqual(new Set(['false']))
  })

  it('pulses again on a new visit', async () => {
    const user = userEvent.setup()
    const { unmount } = renderProjects()
    await user.click(screen.getAllByTestId(TOGGLE)[0])
    unmount()

    renderProjects()
    expect(new Set(getPulses())).toEqual(new Set(['true']))
  })
})
