import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Tooltip, TooltipProvider } from '../Tooltip'

const renderTooltip = () => {
  render(
    <TooltipProvider>
      <Tooltip content="GitHub Profile">
        <a href="https://github.com/bvandrc">github.com/bvandrc</a>
      </Tooltip>
    </TooltipProvider>
  )
  return screen.getByRole('link', { name: 'github.com/bvandrc' })
}

describe('Tooltip', () => {
  it('stays closed until its trigger is hovered or focused', () => {
    renderTooltip()
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('opens on keyboard focus, describing the trigger', async () => {
    const link = renderTooltip()
    await userEvent.tab()
    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip).toHaveProperty('textContent', 'GitHub Profile')
    expect(link.getAttribute('aria-describedby')).toBe(tooltip.id)
  })

  it('closes on Escape', async () => {
    renderTooltip()
    await userEvent.tab()
    await screen.findByRole('tooltip')
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('tooltip')).toBeNull()
  })
})
