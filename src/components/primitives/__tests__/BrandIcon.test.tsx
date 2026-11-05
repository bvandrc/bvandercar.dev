import { render, screen } from '@testing-library/react'

import { BrandIcon } from '../BrandIcon'

const getIconSvg = (img: HTMLElement) =>
  decodeURIComponent(
    img.getAttribute('src')?.replace('data:image/svg+xml,', '') ?? ''
  )

describe('BrandIcon', () => {
  it("draws Simple Icons' logo in the given color", () => {
    render(<BrandIcon slug="react" color="61dafb" size={14} alt="React" />)
    const svg = getIconSvg(screen.getByRole('img', { name: 'React' }))
    expect(svg).toMatch(/^<svg [^>]*fill="#61dafb"><path d="M/)
  })

  it('falls back to a committed logo where Simple Icons lacks one', () => {
    render(
      <BrandIcon slug="playwright" color="2ead33" size={14} alt="Playwright" />
    )
    const svg = getIconSvg(screen.getByRole('img', { name: 'Playwright' }))
    // Devicon's, in its own colors rather than the given one.
    expect(svg).toMatch(/^<svg viewBox="0 0 128 128"/)
    expect(svg).not.toContain('2ead33')
  })

  it('renders nothing for a slug with no logo', () => {
    const { container } = render(
      <BrandIcon slug="accessibility" color="0170ea" size={14} />
    )
    expect(container.innerHTML).toBe('')
  })
})
