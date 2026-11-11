import { useRef } from 'react'
import { SKILL_ICON_COLORS } from 'virtual:icons'
import { TAILWIND_BREAKPOINTS, useIsMobile } from '@bvandrc/react-toolkit'

import { SECTIONS } from '@/generated/profile/content/sections'
import {
  SKILLS,
  type SkillRow,
  type SkillSection,
} from '@/generated/profile/content/skills'
import { cn } from '@/lib/cn'
import { skillIconSlug } from '@/lib/icons'
import { sectionAnchor } from '@/lib/section-anchor'
import { THEME_COLORS } from '@/lib/theme-colors'
import { Badge } from '../primitives/Badge'
import { BrandIcon } from '../primitives/BrandIcon'
import { Section, SubSection } from '../Section'
import { useSkillsLayout } from './hooks/useSkillsLayout'

type SkillsRowProps = {
  row: SkillRow
}

/** A row's label, and its skills' badges beside it. */
const SkillsRow = ({ row }: SkillsRowProps) => (
  // Two columns, on the group's grid: the label, and the skills beside it.
  <div className="col-span-2 grid grid-cols-subgrid items-start">
    <dt
      className={cn(
        'text-right text-ink-muted',
        'text-xs sm:text-sm',
        // Level with the first line of badges, a touch above center, where
        // it reads in line with their names.
        'pt-0.5 sm:pt-0.75'
      )}>
      {/* Its own element, which the layout measures the text by. The line
          breaks are for the README's narrow column. */}
      <span>{row.label.replaceAll('\n', ' ')}</span>
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

type SkillsGroupProps = {
  group: SkillSection
}

/** A group's heading, and its rows below it, centered under it. */
const SkillsGroup = ({ group }: SkillsGroupProps) => {
  const listRef = useRef<HTMLDListElement>(null)
  useSkillsLayout(listRef, useIsMobile(TAILWIND_BREAKPOINTS.SM))
  return (
    <SubSection icon={group.glyph} title={group.title}>
      <dl
        ref={listRef}
        className={cn(
          // A grid only as wide as its widest row, up to 512px from sm,
          // where a long row wraps.
          'mx-auto grid w-fit max-w-full sm:max-w-lg',
          // The skills' column takes the room first, and the labels' the
          // rest, up to as wide as the longest, so a label wraps before its
          // skills do.
          'grid-cols-[minmax(min-content,1fr)_auto]',
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
    className={cn(
      // Below sm, runs into the page's side padding, which is App's px-5, to
      // fit more skills to a line.
      '-mx-5 sm:mx-0',
      // Hides the empty edge of a group shifted past its side.
      'overflow-x-clip'
    )}
    data-testid="skills">
    {SKILLS.map((group) => (
      <SkillsGroup key={group.title} group={group} />
    ))}
  </Section>
)
