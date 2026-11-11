import { useRef } from 'react'
import { SKILL_ICON_COLORS } from 'virtual:icons'

import { SECTIONS } from '@/generated/profile/content/sections'
import { SKILLS, type SkillSection } from '@/generated/profile/content/skills'
import { cn } from '@/lib/cn'
import { skillIconSlug } from '@/lib/icons'
import { sectionAnchor } from '@/lib/section-anchor'
import { THEME_COLORS } from '@/lib/theme-colors'
import { Badge } from '../primitives/Badge'
import { BrandIcon } from '../primitives/BrandIcon'
import { Section, SubSection } from '../Section'
import { useSkillGroupLayout } from './hooks/useSkillGroupLayout'

type SkillGroupProps = {
  group: SkillSection
}

/**
 * A group's rows as two columns: each label, right-aligned, beside its badges.
 *
 * The group is centered as a whole below sm, and from sm up, centered on its
 * first row of badges with the labels hanging to their left.
 */
const SkillGroup = ({ group }: SkillGroupProps) => {
  const ref = useRef<HTMLDListElement>(null)
  useSkillGroupLayout(ref)
  return (
    <SubSection
      icon={group.glyph}
      title={group.title}
      data-testid="skill-group">
      <dl
        ref={ref}
        data-testid="skill-group-rows"
        className={cn(
          // The labels' column gives up its room first, so a label only wraps
          // where its badges couldn't otherwise keep their lines.
          'grid w-fit grid-cols-[1fr_auto] self-center',
          'gap-x-2 gap-y-3 sm:gap-x-3',
          'sm:max-w-lg sm:translate-x-(--first-row-shift)'
        )}>
        {group.rows.map((row) => {
          // The label's line breaks are for the README's narrow column.
          const label = row.label.replaceAll('\n', ' ')
          return (
            <div key={label} className="col-span-full grid grid-cols-subgrid">
              <dt
                data-testid="skill-label"
                className={cn(
                  'text-right text-xs text-ink-muted sm:text-sm',
                  // Level with its first line of badges, a touch above center,
                  // where it reads in line with their names.
                  'pt-0.5 sm:pt-0.75'
                )}>
                {label}
              </dt>
              <dd
                data-testid="skill-badges"
                className={cn(
                  'flex flex-wrap gap-1.5 sm:justify-center sm:gap-2',
                  // Its badges' own height, not a two-line label's, which
                  // would stretch them.
                  'self-start'
                )}>
                {row.lines.flat().map((skill) => {
                  const slug = skillIconSlug(skill)
                  return (
                    <Badge
                      key={skill.alt}
                      data-testid="skill-badge"
                      // Smaller below sm, so more fit on a line.
                      className="max-sm:px-1.5 max-sm:py-0.5 max-sm:text-[13px]/[18px]">
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
  )
}

export const Skills = () => (
  <Section
    glyph={SECTIONS.SKILLS.glyph}
    title={SECTIONS.SKILLS.title}
    id={sectionAnchor(SECTIONS.SKILLS.title)}
    // The full screen's width below sm, for as many badges on a line as fit.
    className="max-sm:-mx-5"
    data-testid="skills">
    {SKILLS.map((group) => (
      <SkillGroup key={group.title} group={group} />
    ))}
  </Section>
)
