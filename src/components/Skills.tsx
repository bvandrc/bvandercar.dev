import { colord, extend } from 'colord'
import a11yPlugin from 'colord/plugins/a11y'

import { SECTIONS } from '@/generated/profile/content/sections'
import type { SkillBadge } from '@/generated/profile/content/skills'
import { SKILLS } from '@/generated/profile/content/skills'
import { cn } from '@/lib/cn'
import { skillIconSlug } from '@/lib/icons'
import { THEME_COLORS } from '@/lib/theme-colors'
import { BrandIcon } from './primitives/BrandIcon'
import { Section, SubSection } from './Section'

// Adds colord's WCAG contrast and luminance methods.
extend([a11yPlugin])

/** Below this WCAG contrast ratio against the chip, a brand color is too dark to see. */
const MIN_ICON_CONTRAST = 2

/**
 * A skill logo's brand color, from its shields.io badge.
 *
 * The badge's logo color where that's a real color, else its background,
 * since a white or black logo was only ever drawn on that. One too dark for
 * the chip uses the chip's ink.
 */
const skillIconColor = ({ logoColor, path }: SkillBadge) => {
  const logoHex = decodeURIComponent(logoColor).replace('#', '')
  const badgeHex = decodeURIComponent(path).match(
    /-#?([0-9a-f]{6})(?:\.svg)?$/i
  )?.[1]
  const brand = colord(`#${logoHex}`).isValid() ? logoHex : badgeHex
  return brand &&
    colord(`#${brand}`).contrast(`#${THEME_COLORS.SURFACE}`) >=
      MIN_ICON_CONTRAST
    ? brand
    : THEME_COLORS.INK
}

export const Skills = () => (
  <Section
    glyph={SECTIONS.SKILLS.glyph}
    title={SECTIONS.SKILLS.title}
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
                  {row.lines.flat().map((skill) => (
                    <span
                      key={skill.alt}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-sm',
                        // Glows orange on hover, like the project cards.
                        'hover-glow-12'
                      )}>
                      <BrandIcon
                        slug={skillIconSlug(skill)}
                        color={skillIconColor(skill)}
                        size={14}
                        className="size-3.5"
                      />
                      {skill.alt}
                    </span>
                  ))}
                </dd>
              </div>
            )
          })}
        </dl>
      </SubSection>
    ))}
  </Section>
)
