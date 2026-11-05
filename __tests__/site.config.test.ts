import { PROJECTS } from '@/generated/profile/content/projects'
import { SECURITY_HEADERS } from '../site.config'

/** The sources a CSP directive allows, or none when it's absent. */
const getDirectiveSources = (directive: string) =>
  SECURITY_HEADERS['Content-Security-Policy']
    .split('; ')
    .find((entry) => entry.startsWith(`${directive} `))
    ?.split(' ')
    .slice(1) ?? []

describe('SECURITY_HEADERS', () => {
  it('lets every project with a live preview load in a frame', () => {
    const frameSources = getDirectiveSources('frame-src')
    const embedded = PROJECTS.flatMap(({ projects }) => projects).filter(
      ({ embed }) => embed
    )
    expect(embedded).not.toHaveLength(0)
    for (const { name, href } of embedded) {
      expect(frameSources, name).toContain(new URL(href).origin)
    }
  })
})
