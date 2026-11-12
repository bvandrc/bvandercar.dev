import { screen } from '@testing-library/react'

import { renderWithProviders } from '@/test-helpers/render'
import { SELECTORS } from '~/test-support/selectors'
import { SocialLinks } from '../SocialLinks'

const { EMAIL } = SELECTORS.SOCIAL_LINKS

describe('SocialLinks', () => {
  it('links to my email, with a subject naming the site, in the same tab', () => {
    renderWithProviders(<SocialLinks />)
    expect(screen.getByTestId(EMAIL)).toMatchObject({
      href: 'mailto:blake@bvandercar.dev?subject=From%20bvandercar.dev',
      // A mail client opens from it, leaving no empty tab behind.
      target: '',
    })
  })
})
