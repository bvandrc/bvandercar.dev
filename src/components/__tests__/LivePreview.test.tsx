import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { SELECTORS } from '~/test-support/selectors'
import { LivePreview } from '../LivePreview'

const { TOGGLE, FRAME } = SELECTORS.LIVE_PREVIEW

const SRC = 'https://example.com/'

describe('LivePreview', () => {
  it('loads no frame until opened', () => {
    render(<LivePreview src={SRC} title="Example" />)
    expect(screen.queryByTestId(FRAME)).toBeNull()
  })

  it('shows the page in a named frame once opened, and drops it once closed', async () => {
    const user = userEvent.setup()
    render(<LivePreview src={SRC} title="Example" />)

    await user.click(screen.getByTestId(TOGGLE))
    expect(screen.getByTestId(FRAME)).toMatchObject({
      src: SRC,
      title: 'Example live preview',
    })

    await user.click(screen.getByTestId(TOGGLE))
    expect(screen.queryByTestId(FRAME)).toBeNull()
  })

  it('pulses its toggle only while asked to', () => {
    const { rerender } = render(<LivePreview src={SRC} title="Example" pulse />)
    expect(screen.getByTestId(TOGGLE).dataset.pulse).toBe('true')

    rerender(<LivePreview src={SRC} title="Example" />)
    expect(screen.getByTestId(TOGGLE).dataset.pulse).toBe('false')
  })

  it('shows what its open prop says, and asks to change it on each toggle, when given one', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    const { rerender } = render(
      <LivePreview
        src={SRC}
        title="Example"
        open={false}
        onOpenChange={onOpenChange}
      />
    )

    await user.click(screen.getByTestId(TOGGLE))
    // Its parent hasn't said yes yet.
    expect(screen.queryByTestId(FRAME)).toBeNull()

    rerender(
      <LivePreview src={SRC} title="Example" open onOpenChange={onOpenChange} />
    )
    expect(screen.getByTestId(FRAME)).toBeDefined()

    await user.click(screen.getByTestId(TOGGLE))
    expect(onOpenChange.mock.calls).toEqual([[true], [false]])
  })
})
