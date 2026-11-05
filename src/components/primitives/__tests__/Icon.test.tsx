import { render, screen } from '@testing-library/react'

import { Icon } from '../Icon'

vi.mock('virtual:icons', () => ({
  UI_ICONS: {
    'chevron-right': {
      viewBox: '0 0 24 24',
      body: '<path stroke="currentColor" d="m9 18l6-6l-6-6"/>',
    },
  },
}))

const ICON_TEST_ID = 'icon'

describe('Icon', () => {
  it('draws the glyph inline, so it takes the text color around it', () => {
    render(<Icon name="chevron-right" data-testid={ICON_TEST_ID} />)
    const svg = screen.getByTestId(ICON_TEST_ID)
    expect(svg.tagName.toLowerCase()).toBe('svg')
    expect(svg.getAttribute('viewBox')).toBe('0 0 24 24')
    expect(svg.innerHTML).toBe(
      '<path stroke="currentColor" d="m9 18l6-6l-6-6"></path>'
    )
  })

  it('is hidden from screen readers', () => {
    render(<Icon name="chevron-right" data-testid={ICON_TEST_ID} />)
    expect(screen.getByTestId(ICON_TEST_ID).getAttribute('aria-hidden')).toBe(
      'true'
    )
  })
})
