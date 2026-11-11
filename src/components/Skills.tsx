import { useRef } from 'react'
import { SKILL_ICON_COLORS } from 'virtual:icons'
import { TAILWIND_BREAKPOINTS, useIsMobile } from '@bvandrc/react-toolkit'

import { SECTIONS } from '@/generated/profile/content/sections'
import {
  SKILLS,
  type SkillRow,
  type SkillSection,
} from '@/generated/profile/content/skills'
import { useAlignToFirstLine } from '@/hooks/useAlignToFirstLine'
import { type Span, useCenterSpan } from '@/hooks/useCenterSpan'
import { useCenterWrappedLines } from '@/hooks/useCenterWrappedLines'
import { useCenterWrappedLinesOnParent } from '@/hooks/useCenterWrappedLinesOnParent'
import { cn } from '@/lib/cn'
import { measureFlexLines } from '@/lib/flex-lines'
import { skillIconSlug } from '@/lib/icons'
import { sectionAnchor } from '@/lib/section-anchor'
import { THEME_COLORS } from '@/lib/theme-colors'
import { Badge } from './primitives/Badge'
import { BrandIcon } from './primitives/BrandIcon'
import { Section, SubSection } from './Section'

type SkillsRowProps = {
  row: SkillRow
  /** Below sm, where the skills center rather than start by the label */
  isMobile: boolean
}

/** A row's label, and its skills' badges beside it. */
const SkillsRow = ({ row, isMobile }: SkillsRowProps) => {
  const labelRef = useRef<HTMLElement>(null)
  const skillsRef = useRef<HTMLElement>(null)
  useCenterWrappedLines(skillsRef, !isMobile)
  // Keeps the label right by its skills' first line, wherever that sits.
  useAlignToFirstLine(labelRef, skillsRef)
  // The label's line breaks are for the README's narrow column.
  const label = row.label.replaceAll('\n', ' ')
  return (
    // Two columns, on the group's grid: the label, and the skills beside it.
    <div className="col-span-2 grid grid-cols-subgrid items-start">
      <dt
        ref={labelRef}
        className={cn(
          'text-right text-ink-muted',
          'text-xs sm:text-sm',
          // Level with the first line of badges, a touch above center, where
          // it reads in line with their names.
          'pt-0.5 sm:pt-0.75'
        )}>
        {label}
      </dt>
      {/* Below sm, every line centers in the group's column of skills. From
          sm, the first starts right by the label, and the lines that wrap
          center on it. */}
      <dd
        ref={skillsRef}
        className="flex flex-wrap justify-center gap-1.5 sm:justify-start sm:gap-2">
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

// The first line of a group's first row of skills.
const measureFirstLine = (list: HTMLElement): Span | undefined => {
  const skills = list.querySelector<HTMLElement>('dd')
  return skills === null ? undefined : measureFlexLines(skills)[0]
}

// A group's rows of skills.
const findSkills = (list: HTMLElement) =>
  list.querySelectorAll<HTMLElement>('dd')

// All a group shows: from its labels' text to the end of its farthest first
// line of badges.
const measureContent = (list: HTMLElement): Span | undefined => {
  const rects = [
    // The text, not the label, which runs past a short one's start.
    ...Array.from(list.querySelectorAll('dt'), (label) => {
      const text = document.createRange()
      text.selectNodeContents(label)
      return text.getBoundingClientRect()
    }),
    // First lines alone, since below sm the lines that wrap center on the
    // section once the group has, and never run past them.
    ...Array.from(findSkills(list), (skills) => measureFlexLines(skills)[0]),
  ].filter((rect) => rect !== undefined)
  if (rects.length === 0) {
    return undefined
  }
  return {
    left: Math.min(...rects.map(({ left }) => left)),
    right: Math.max(...rects.map(({ right }) => right)),
  }
}

type SkillsGroupProps = {
  group: SkillSection
}

/** A group's heading, and its rows below it. */
const SkillsGroup = ({ group }: SkillsGroupProps) => {
  const listRef = useRef<HTMLDListElement>(null)
  // From sm up, its first row's first line centers under the heading, with
  // the labels to its left. Below sm, all it shows centers, labels and all.
  // Either way, all it shows stays on screen, though the list's empty edge
  // may not.
  const isMobile = useIsMobile(TAILWIND_BREAKPOINTS.SM)
  useCenterSpan(
    listRef,
    isMobile ? measureContent : measureFirstLine,
    measureContent
  )
  // Below sm, the lines its rows wrap onto center on the section, not their
  // column, which the labels push right. After the group's own shift, which
  // it measures from.
  useCenterWrappedLinesOnParent(listRef, findSkills, isMobile)
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
          <SkillsRow key={row.label} row={row} isMobile={isMobile} />
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
