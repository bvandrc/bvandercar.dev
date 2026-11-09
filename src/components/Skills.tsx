import { SKILL_ICON_COLORS } from 'virtual:icons'

import { SECTIONS } from '@/generated/profile/content/sections'
import { SKILLS } from '@/generated/profile/content/skills'
import { skillIconSlug } from '@/lib/icons'
import { sectionAnchor } from '@/lib/section-anchor'
import { THEME_COLORS } from '@/lib/theme-colors'
import { Badge } from './primitives/Badge'
import { BrandIcon } from './primitives/BrandIcon'
import { Section, SubSection } from './Section'

export const Skills = () => (
  <Section
    glyph={SECTIONS.SKILLS.glyph}
    title={SECTIONS.SKILLS.title}
    id={sectionAnchor(SECTIONS.SKILLS.title)}
    data-testid="skills">
    {SKILLS.map((group) => (
      <SubSection key={group.title} icon={group.glyph} title={group.title}>
        <dl className="flex flex-col gap-3">
          {group.rows.map((row) => {
            // The label's line breaks are for the README's narrow column.
            const label = row.label.replaceAll('\n', ' ')
            return (
              // Below sm, a label sits above its skills; from sm up, beside
              // them, with the row centered as a whole.
              <div
                key={label}
                className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3">
                <dt className="shrink-0 text-sm text-ink-muted">{label}</dt>
                <dd className="flex flex-wrap justify-center gap-2">
                  {row.lines.flat().map((skill) => {
                    const slug = skillIconSlug(skill)
                    return (
                      <Badge key={skill.alt}>
                        <BrandIcon
                          slug={slug}
                          color={SKILL_ICON_COLORS[slug] ?? THEME_COLORS.INK}
                          size={14}
                          className="size-3.5"
                        />
                        {skill.alt}
                      </Badge>
                    )
                  })}
                </dd>
              </div>
            )
          })}
        </dl>
      </SubSection>
    ))}
  </Section>
)
