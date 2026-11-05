import { fireEvent, render, screen } from '@testing-library/react'

import { DevIcon } from '../DevIcon'

const renderPlaywrightIcon = () => {
  render(
    <DevIcon slug="playwright" color="2ead33" size={14} alt="Playwright" />
  )
  return screen.getByRole('img', { name: 'Playwright' })
}

describe('DevIcon', () => {
  it("starts from Simple Icons' logo in the given color", () => {
    const img = renderPlaywrightIcon()
    expect(img).toHaveProperty(
      'src',
      'https://cdn.simpleicons.org/playwright/2ead33'
    )
  })

  it("falls back to Devicon's logo when Simple Icons lacks one", () => {
    const img = renderPlaywrightIcon()
    fireEvent.error(img)
    expect(img).toMatchObject({
      src: 'https://cdn.jsdelivr.net/npm/devicon@2.18.0/icons/playwright/playwright-original.svg',
      hidden: false,
    })
  })

  it('hides when Devicon lacks one too', () => {
    const img = renderPlaywrightIcon()
    fireEvent.error(img)
    fireEvent.error(img)
    expect(img).toHaveProperty('hidden', true)
  })
})
