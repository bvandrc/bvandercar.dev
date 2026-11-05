import { render, screen } from '@testing-library/react'

import { Section } from '../Section'

describe('Section', () => {
  it('draws a glyph on both sides of the heading, hidden from its name', () => {
    render(
      <Section icon={{ glyph: 'wrench' }} title="Skills">
        <p>Body</p>
      </Section>
    )
    const heading = screen.getByRole('heading', { name: 'Skills' })
    const glyphs = heading.querySelectorAll('svg[aria-hidden="true"]')
    expect(glyphs).toHaveLength(2)
    for (const glyph of glyphs) {
      // The site's secondary orange, rather than the heading's text color.
      expect(glyph.getAttribute('class'), glyph.outerHTML).toContain(
        'text-orange-400'
      )
    }
  })
})
