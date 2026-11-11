import { useRef } from 'react'
import { SKILL_ICON_COLORS } from 'virtual:icons'

import { SECTIONS } from '@/generated/profile/content/sections'
import { SKILLS, type SkillRow } from '@/generated/profile/content/skills'
import { useCenterWrappedLines } from '@/hooks/useCenterWrappedLines'
import { cn } from '@/lib/cn'
import { skillIconSlug } from '@/lib/icons'
import { sectionAnchor } from '@/lib/section-anchor'
import { THEME_COLORS } from '@/lib/theme-colors'
import { Badge } from './primitives/Badge'
import { BrandIcon } from './primitives/BrandIcon'
import { Section, SubSection } from './Section'

type SkillsRowProps = {
  row: SkillRow
}

/** A row's label, and its skills' badges beside it. */
const SkillsRow = ({ row }: SkillsRowProps) => {
  const skillsRef = useRef<HTMLElement>(null)
  useCenterWrappedLines(skillsRef)
  // The label's line breaks are for the README's narrow column.
  const label = row.label.replaceAll('\n', ' ')
  return (
    // A label sits beside its skills, level with their first line. Below sm,
    // the labels form a right-aligned column the skills wrap beside; from sm
    // up, each row is centered as a whole.
    <div className="flex items-start gap-2 sm:justify-center sm:gap-3">
      <dt
        className={cn(
          'shrink-0 text-ink-muted',
          'w-16 text-right text-xs',
          'sm:w-auto sm:text-left sm:text-sm',
          // Level with the first line of badges, a touch above center, where
          // it reads in line with their names.
          'pt-0.5 sm:pt-0.75'
        )}>
        {label}
      </dt>
      {/* Its first line starts right by the label, and the lines that wrap
          center on it. */}
      <dd
        ref={skillsRef}
        className="flex flex-wrap justify-start gap-1.5 sm:gap-2">
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
}

export const Skills = () => (
  <Section
    glyph={SECTIONS.SKILLS.glyph}
    title={SECTIONS.SKILLS.title}
    id={sectionAnchor(SECTIONS.SKILLS.title)}
    // Below sm, runs into the page's side padding, which is App's px-5, to
    // fit more skills to a line.
    className="-mx-5 sm:mx-0"
    data-testid="skills">
    {SKILLS.map((group) => (
      <SubSection key={group.title} icon={group.glyph} title={group.title}>
        <dl className="flex flex-col gap-3">
          {group.rows.map((row) => (
            <SkillsRow key={row.label} row={row} />
          ))}
        </dl>
      </SubSection>
    ))}
  </Section>
)
