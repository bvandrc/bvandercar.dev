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

  it('reports each open and close', async () => {
    const user = userEvent.setup()
    const onOpenChange = vi.fn()
    render(
      <LivePreview src={SRC} title="Example" onOpenChange={onOpenChange} />
    )

    await user.click(screen.getByTestId(TOGGLE))
    await user.click(screen.getByTestId(TOGGLE))
    expect(onOpenChange.mock.calls).toEqual([[true], [false]])
  })
})
