import { render, screen } from '@testing-library/react'

import { BrandIcon } from '../BrandIcon'

// A one-color logo, as Simple Icons' are, and a multicolor one, as Devicon's.
vi.mock('virtual:icons', () => ({
  BRAND_ICONS: {
    react: {
      viewBox: '0 0 24 24',
      body: '<path fill="currentColor" d="M0 0h24v24H0z"/>',
    },
    playwright: {
      viewBox: '0 0 128 128',
      body: '<path fill="#2ead33" d="M0 0h128v128H0z"/>',
    },
  },
}))

const getIconSvg = (img: HTMLElement) =>
  decodeURIComponent(
    img.getAttribute('src')?.replace('data:image/svg+xml,', '') ?? ''
  )

describe('BrandIcon', () => {
  it('draws a one-color logo in the given color', () => {
    render(<BrandIcon slug="react" color="61dafb" size={14} alt="React" />)
    const svg = getIconSvg(screen.getByRole('img', { name: 'React' }))
    expect(svg).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" color="#61dafb"><path fill="currentColor" d="M0 0h24v24H0z"/></svg>'
    )
  })

  it('draws a multicolor logo in its own colors, in its own viewBox', () => {
    render(
      <BrandIcon slug="playwright" color="000000" size={14} alt="Playwright" />
    )
    const svg = getIconSvg(screen.getByRole('img', { name: 'Playwright' }))
    expect(svg).toMatch(/viewBox="0 0 128 128"[^>]*><path fill="#2ead33"/)
  })

  it('renders nothing for a slug with no logo', () => {
    const { container } = render(
      <BrandIcon slug="accessibility" color="0170ea" size={14} />
    )
    expect(container.innerHTML).toBe('')
  })
})
