import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'
import type { Result } from 'axe-core'

function formatViolations(violations: Result[]): string {
  return violations
    .map(
      (v) =>
        `\n[${v.impact}] ${v.id}: ${v.help}\n  ${v.helpUrl}\n` +
        v.nodes.map((n) => `  - ${n.target.join(' ')}`).join('\n')
    )
    .join('\n')
}

export async function checkA11y(
  page: Page,
  options: { disableRules?: string[] } = {}
) {
  // Chrome reports interpolated values mid-transition, which axe reads as
  // contrast failures that never actually render. Looping CSS animations are
  // ignored so this can't hang.
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every((a) => !(a instanceof CSSTransition) || a.playState !== 'running')
  )

  const builder = new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .disableRules(options.disableRules ?? [])

  const { violations } = await builder.analyze()

  expect(violations, formatViolations(violations)).toEqual([])
}
