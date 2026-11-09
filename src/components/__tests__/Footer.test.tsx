import { screen } from '@testing-library/react'

import { renderWithProviders } from '@/test-helpers/render'
import { SELECTORS } from '~/test-support/selectors'
import { Footer } from '../Footer'

const { SOURCE_LINK, BUILD_DATE } = SELECTORS.FOOTER

const BUILD_DAY = '2026-03-02'

describe('Footer', () => {
  beforeEach(() => {
    vi.stubEnv('BUILD_DATE', BUILD_DAY)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("links to the site's source in a new tab", () => {
    renderWithProviders(<Footer />)
    expect(screen.getByTestId(SOURCE_LINK)).toMatchObject({
      href: 'https://github.com/bvandrc/bvandercar.dev',
      target: '_blank',
    })
  })

  it('shows the day the site was built, with its ISO date for machines', () => {
    renderWithProviders(<Footer />)
    expect(screen.getByTestId(BUILD_DATE)).toMatchObject({
      textContent: 'Mar 2, 2026',
      dateTime: BUILD_DAY,
    })
  })
})
