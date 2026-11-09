import { readFileSync } from 'node:fs'
import { kebabCase } from 'es-toolkit'
import { objectEntries } from 'ts-extras'

import { THEME_COLORS } from '../theme-colors'

const THEME_CSS = readFileSync('src/styles/index.css', 'utf8')

/** The hex value, without the `#`, `index.css` gives the `--color-<token>` token. */
const getTokenHex = (token: string) =>
  THEME_CSS.match(new RegExp(`--color-${token}:\\s*#([0-9a-f]{6});`, 'i'))?.[1]

describe('THEME_COLORS', () => {
  it('matches each theme token it mirrors', () => {
    for (const [name, hex] of objectEntries(THEME_COLORS)) {
      expect(getTokenHex(kebabCase(name)), name).toBe(hex)
    }
  })
})
