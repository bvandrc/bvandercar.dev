import { BEYOND_CODE } from '@/generated/profile/content/about'
import { SECTIONS } from '@/generated/profile/content/sections'
import { sectionAnchor } from '@/lib/section-anchor'
import { List } from './primitives/List'
import { Section } from './Section'

export const BeyondCode = () => (
  <Section
    glyph={SECTIONS.BEYOND_CODE.glyph}
    title={SECTIONS.BEYOND_CODE.title}
    id={sectionAnchor(SECTIONS.BEYOND_CODE.title)}
    data-testid="beyond-code">
    <p className="font-semibold text-ink-muted">{BEYOND_CODE.intro}</p>
    <List className="flex flex-col gap-1 text-ink-muted">
      {BEYOND_CODE.lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </List>
  </Section>
)
