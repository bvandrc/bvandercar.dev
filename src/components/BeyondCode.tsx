import { BEYOND_CODE } from '@/generated/profile/content/about'
import { SECTIONS } from '@/generated/profile/content/sections'
import { Section } from './Section'

export const BeyondCode = () => (
  <Section
    glyph={SECTIONS.BEYOND_CODE.glyph}
    title={SECTIONS.BEYOND_CODE.title}
    data-testid="beyond-code">
    <p className="text-ink-muted">{BEYOND_CODE.intro}</p>
    {/* biome-ignore lint/a11y/noRedundantRoles: Safari drops list semantics once Tailwind removes the bullets. */}
    <ul role="list" className="flex flex-col gap-1 text-ink-muted">
      {BEYOND_CODE.lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  </Section>
)
