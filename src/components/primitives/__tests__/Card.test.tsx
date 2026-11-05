import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { Card } from '../Card'

const SELF = 'card'
const TEXT = 'card-text'
const LINK = 'card-link'
const BUTTON = 'card-button'
const LINK_TEXT = 'card-link-text'

const renderCard = (onSurfaceClick: () => void) =>
  render(
    <Card onSurfaceClick={onSurfaceClick} data-testid={SELF}>
      <p data-testid={TEXT}>Some text</p>
      <a href="#target" data-testid={LINK}>
        <span data-testid={LINK_TEXT}>Example site</span>
      </a>
      <button type="button" data-testid={BUTTON}>
        Do something
      </button>
    </Card>
  )

describe('Card', () => {
  it('reports a click on its surface, or on plain content inside it', async () => {
    const user = userEvent.setup()
    const onSurfaceClick = vi.fn()
    renderCard(onSurfaceClick)

    await user.click(screen.getByTestId(SELF))
    await user.click(screen.getByTestId(TEXT))
    expect(onSurfaceClick).toHaveBeenCalledTimes(2)
  })

  it('ignores a click on a control inside it', async () => {
    const user = userEvent.setup()
    const onSurfaceClick = vi.fn()
    renderCard(onSurfaceClick)

    for (const testId of [
      LINK,
      // Inside a link, which still takes the click.
      LINK_TEXT,
      BUTTON,
    ]) {
      await user.click(screen.getByTestId(testId))
      expect(onSurfaceClick, testId).not.toHaveBeenCalled()
    }
  })

  it('ignores a click that ends a text selection', async () => {
    const user = userEvent.setup()
    const onSurfaceClick = vi.fn()
    renderCard(onSurfaceClick)

    const text = screen.getByTestId(TEXT)
    await user.pointer([
      { keys: '[MouseLeft>]', target: text, offset: 0 },
      { offset: 4 },
      { keys: '[/MouseLeft]' },
    ])
    expect(window.getSelection()?.toString()).toBe('Some')
    expect(onSurfaceClick).not.toHaveBeenCalled()
  })

  it('still calls its own onClick', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Card onClick={onClick} data-testid={SELF} />)

    await user.click(screen.getByTestId(SELF))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
