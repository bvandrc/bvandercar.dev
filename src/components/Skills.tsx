import { colord, extend } from 'colord'
import a11yPlugin from 'colord/plugins/a11y'

import { SECTIONS } from '@/generated/profile/content/sections'
import type { SkillBadge } from '@/generated/profile/content/skills'
import { SKILLS } from '@/generated/profile/content/skills'
import { skillIconSlug } from '@/lib/icons'
import { cn } from '@/utils'
import { BrandIcon } from './primitives/BrandIcon'
import { Section } from './Section'

// Adds colord's WCAG contrast and luminance methods.
extend([a11yPlugin])

// Mirror the surface and ink theme tokens in src/styles/index.css.
const CHIP_BACKGROUND = '141a25'
const CHIP_INK = 'f0f4fa'

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
    colord(`#${brand}`).contrast(`#${CHIP_BACKGROUND}`) >= MIN_ICON_CONTRAST
    ? brand
    : CHIP_INK
}

export const Skills = () => (
  <Section
    glyph={SECTIONS.SKILLS.glyph}
    title={SECTIONS.SKILLS.title}
    data-testid="skills">
    {SKILLS.map((group) => (
      <Section
        key={group.title}
        icon={group.icon}
        title={group.title}
        level="h3"
        className="flex flex-col gap-3">
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
                        'transition-[box-shadow,border-color] duration-200',
                        // Glows orange on hover, like the project cards.
                        'hover:border-orange-400 hover:shadow-glow-12 hover:shadow-orange-500'
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
      </Section>
    ))}
  </Section>
)
