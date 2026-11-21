import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createPortal } from 'react-dom'

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

  it('ignores a click something inside it cancelled, as handled, like a tap that opens a tooltip', async () => {
    const user = userEvent.setup()
    const onSurfaceClick = vi.fn()
    render(
      <Card onSurfaceClick={onSurfaceClick} data-testid={SELF}>
        {/* biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: a stand-in for a trigger that handles a tap itself. */}
        <span onClick={(event) => event.preventDefault()} data-testid={TEXT}>
          Some text
        </span>
      </Card>
    )

    await user.click(screen.getByTestId(TEXT))
    expect(onSurfaceClick).not.toHaveBeenCalled()
  })

  it('ignores a click in a portal it renders, like a tooltip, outside it', async () => {
    const user = userEvent.setup()
    const onSurfaceClick = vi.fn()
    render(
      <Card onSurfaceClick={onSurfaceClick} data-testid={SELF}>
        {createPortal(<p data-testid={TEXT}>Some text</p>, document.body)}
      </Card>
    )

    await user.click(screen.getByTestId(TEXT))
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
