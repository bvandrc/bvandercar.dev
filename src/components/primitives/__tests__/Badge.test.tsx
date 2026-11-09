import { render, screen } from '@testing-library/react'

import { Badge } from '../Badge'

describe('Badge', () => {
  it('renders a span by default', () => {
    render(<Badge>TypeScript</Badge>)
    expect(screen.getByText('TypeScript').tagName).toBe('SPAN')
  })

  it('styles its child in place of a span with asChild, keeping its own classes', () => {
    const { container } = render(
      <Badge asChild>
        <a href="#skills" className="text-accent">
          Skills
        </a>
      </Badge>
    )
    const link = screen.getByRole('link', { name: 'Skills' })
    expect(container.firstChild).toBe(link)
    expect(link.classList).toContain('rounded-md')
    expect(link.classList).toContain('text-accent')
  })
})
