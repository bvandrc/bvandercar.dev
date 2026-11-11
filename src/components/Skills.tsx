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
    // Two columns: the labels, right-aligned, and the skills beside them.
    // Below sm, the labels' column is the same width in every group.
    <div className="flex items-start gap-2 sm:col-span-2 sm:grid sm:grid-cols-subgrid sm:gap-3">
      <dt
        className={cn(
          'shrink-0 text-right text-ink-muted',
          // Below sm, wide enough for every label but "Project Mgmt.", which
          // takes two lines.
          'w-16 text-xs sm:w-auto sm:text-sm',
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
        <dl
          className={cn(
            'flex flex-col gap-3',
            // From sm up, a grid only as wide as its widest row, up to 512px,
            // where a long row wraps, centered under its heading, its labels'
            // column as wide as its longest.
            'sm:mx-auto sm:grid sm:w-fit sm:max-w-lg sm:grid-cols-[auto_1fr]'
          )}>
          {group.rows.map((row) => (
            <SkillsRow key={row.label} row={row} />
          ))}
        </dl>
      </SubSection>
    ))}
  </Section>
)
