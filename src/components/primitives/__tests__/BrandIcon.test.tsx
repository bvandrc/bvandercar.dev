import { render, screen } from '@testing-library/react'

import { BrandIcon } from '../BrandIcon'

// What the build would find, without reaching Devicon.
vi.mock('virtual:icons', () => ({
  ICONS: {
    react: { path: 'M0 0h24v24H0z' },
    playwright: { src: 'https://cdn.example/playwright.svg' },
  },
}))

const getIconSvg = (img: HTMLElement) =>
  decodeURIComponent(
    img.getAttribute('src')?.replace('data:image/svg+xml,', '') ?? ''
  )

describe('BrandIcon', () => {
  it("draws Simple Icons' logo in the given color", () => {
    render(<BrandIcon slug="react" color="61dafb" size={14} alt="React" />)
    const svg = getIconSvg(screen.getByRole('img', { name: 'React' }))
    expect(svg).toMatch(/^<svg [^>]*fill="#61dafb"><path d="M0 0h24v24H0z"/)
  })

  it("shows Devicon's logo, in its own colors, where Simple Icons lacks one", () => {
    render(
      <BrandIcon slug="playwright" color="2ead33" size={14} alt="Playwright" />
    )
    expect(screen.getByRole('img', { name: 'Playwright' })).toHaveProperty(
      'src',
      'https://cdn.example/playwright.svg'
    )
  })

  it('renders nothing for a slug with no logo', () => {
    const { container } = render(
      <BrandIcon slug="accessibility" color="0170ea" size={14} />
    )
    expect(container.innerHTML).toBe('')
  })
})
