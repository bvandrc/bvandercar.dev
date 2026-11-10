import { SKILL_ICON_COLORS } from 'virtual:icons'

import { SECTIONS } from '@/generated/profile/content/sections'
import { SKILLS } from '@/generated/profile/content/skills'
import { cn } from '@/lib/cn'
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
              // A label sits beside its skills. Below sm, the labels form a
              // right-aligned column the skills wrap beside; from sm up, each
              // row is centered as a whole.
              <div
                key={label}
                className="flex items-center gap-2 sm:justify-center sm:gap-3">
                <dt
                  className={cn(
                    'shrink-0 text-ink-muted',
                    'w-16 text-right text-xs',
                    'sm:w-auto sm:text-left sm:text-sm'
                  )}>
                  {label}
                </dt>
                <dd className="flex flex-wrap gap-1.5 sm:justify-center sm:gap-2">
                  {row.lines.flat().map((skill) => {
                    const slug = skillIconSlug(skill)
                    return (
                      // Smaller below sm, to fit more skills to a line.
                      <Badge
                        key={skill.alt}
                        className="gap-1 px-1.5 py-0.5 text-xs sm:gap-1.5 sm:px-2 sm:py-1 sm:text-sm">
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
