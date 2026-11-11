import { useRef } from 'react'
import { SKILL_ICON_COLORS } from 'virtual:icons'

import { SECTIONS } from '@/generated/profile/content/sections'
import {
  SKILLS,
  type SkillRow,
  type SkillSection,
} from '@/generated/profile/content/skills'
import { useCenterOnFirstLine } from '@/hooks/useCenterOnFirstLine'
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
    // Two columns, on the group's grid: the label, right-aligned, and the
    // skills beside it.
    <div className="col-span-2 grid grid-cols-subgrid items-start">
      <dt
        className={cn(
          'text-right text-ink-muted',
          'text-xs sm:text-sm',
          // Below sm, "Project Mgmt.", the longest, takes two lines, which
          // leaves its skills room for two to a line.
          'max-w-16 sm:max-w-none',
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

// A group's first row of skills, whose first line it centers on.
const findFirstSkills = (list: HTMLElement) =>
  list.querySelector<HTMLElement>('dd')

type SkillsGroupProps = {
  group: SkillSection
}

/** A group's heading, and its rows below it. */
const SkillsGroup = ({ group }: SkillsGroupProps) => {
  const listRef = useRef<HTMLDListElement>(null)
  // Its first row's first line centers under the heading, with the labels to
  // its left.
  useCenterOnFirstLine(listRef, findFirstSkills)
  return (
    <SubSection icon={group.glyph} title={group.title}>
      <dl
        ref={listRef}
        className={cn(
          // A grid only as wide as its widest row, up to 512px from sm,
          // where a long row wraps, its labels' column as wide as its longest.
          'mx-auto grid w-fit max-w-full grid-cols-[auto_1fr] sm:max-w-lg',
          'gap-x-2 gap-y-3 sm:gap-x-3'
        )}>
        {group.rows.map((row) => (
          <SkillsRow key={row.label} row={row} />
        ))}
      </dl>
    </SubSection>
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
      <SkillsGroup key={group.title} group={group} />
    ))}
  </Section>
)
