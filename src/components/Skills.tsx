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
    // Below sm, runs into the page's side padding, which is App's px-5, to
    // fit more skills to a line.
    className="-mx-5 sm:mx-0"
    data-testid="skills">
    {/* Only as wide as the widest row, and centered, so every group's rows
        share one left edge, and their headings center over it. */}
    <div className="mx-auto flex w-fit max-w-full flex-col gap-5">
      {SKILLS.map((group) => (
        <SubSection key={group.title} icon={group.glyph} title={group.title}>
          <dl className="flex flex-col gap-3">
            {group.rows.map((row) => {
              // The label's line breaks are for the README's narrow column.
              const label = row.label.replaceAll('\n', ' ')
              return (
                // Two columns: the labels, right-aligned and the same width in
                // every group, and the skills, wrapping flush left beside them.
                <div key={label} className="flex items-start gap-2 sm:gap-3">
                  <dt
                    className={cn(
                      'shrink-0 text-right text-ink-muted',
                      // Wide enough for every label but "Project Mgmt.", which
                      // takes two lines below sm.
                      'w-16 text-xs sm:w-24 sm:text-sm',
                      // Level with the first line of badges, a touch above
                      // center, where it reads in line with their names.
                      'pt-0.5 sm:pt-0.75'
                    )}>
                    {label}
                  </dt>
                  <dd className="flex flex-wrap gap-1.5 sm:gap-2">
                    {row.lines.flat().map((skill) => {
                      const slug = skillIconSlug(skill)
                      return (
                        // Smaller below sm, to fit more skills to a line.
                        <Badge
                          key={skill.alt}
                          className="px-1.5 py-0.5 text-[0.8125rem]/4.5 sm:px-2 sm:py-1 sm:text-sm">
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
    </div>
  </Section>
)
