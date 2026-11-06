import { render, screen } from '@testing-library/react'

import { Link } from '../Link'

describe('Link', () => {
  it('opens a new tab, named by its text alone, when newTab is set', () => {
    render(
      <Link href="https://example.com" newTab>
        Example
      </Link>
    )
    const link = screen.getByRole('link', { name: 'Example' })
    expect(link).toHaveProperty('target', '_blank')
    expect(link).toHaveProperty('rel', 'noopener noreferrer')
  })

  it('opens in the same tab, named by its text alone, by default', () => {
    render(<Link href="https://example.com">Example</Link>)
    const link = screen.getByRole('link', { name: 'Example' })
    expect(link).toHaveProperty('target', '')
  })
})
