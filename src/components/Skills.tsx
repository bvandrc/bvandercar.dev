import type { SkillBadge } from '@/generated/profile/content/skills'
import { SKILLS } from '@/generated/profile/content/skills'
import { Section } from './primitives/Section'
import { SimpleIcon } from './primitives/SimpleIcon'

// Mirror the surface and ink theme tokens in src/styles/index.css.
const CHIP_BACKGROUND = '141a25'
const CHIP_INK = 'f0f4fa'

/** Below this contrast against the chip, a brand color is too dark to see. */
const MIN_ICON_CONTRAST = 2

const relativeLuminance = (hex: string) => {
  const [r, g, b] = [0, 2, 4].map((i) => {
    const channel = Number.parseInt(hex.slice(i, i + 2), 16) / 255
    return channel <= 0.039_28
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const contrast = (a: string, b: string) => {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort(
    (x, y) => y - x
  )
  return (light + 0.05) / (dark + 0.05)
}

// Shields accepts slug aliases like `tailwind-css`; Simple Icons doesn't.
const skillIconSlug = ({ logo }: SkillBadge) =>
  logo.toLowerCase().replaceAll('-', '')

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
  const brand = /^[0-9a-f]{6}$/i.test(logoHex) ? logoHex : badgeHex
  return brand && contrast(brand, CHIP_BACKGROUND) >= MIN_ICON_CONTRAST
    ? brand
    : CHIP_INK
}

/**
 * Devicon's logo for a skill, in its original colors.
 *
 * The fallback for one Simple Icons lacks, like Playwright, whose logo it
 * withdrew. Pinned, since jsDelivr serves the package as published.
 */
const fallbackIconUrl = (skill: SkillBadge) => {
  const slug = skillIconSlug(skill)
  return `https://cdn.jsdelivr.net/npm/devicon@2.18.0/icons/${slug}/${slug}-original.svg`
}

export const Skills = () => (
  <Section icon="🌟" title="Skills" data-testid="skills">
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
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-sm">
                      <SimpleIcon
                        slug={skillIconSlug(skill)}
                        color={skillIconColor(skill)}
                        width={14}
                        height={14}
                        className="size-3.5"
                        // Simple Icons lacks a few logos, so try Devicon's;
                        // if it lacks one too, hide the image and keep the name.
                        onError={(event) => {
                          const img = event.currentTarget
                          if (img.dataset.fallback) {
                            img.hidden = true
                            return
                          }
                          img.dataset.fallback = 'devicon'
                          img.src = fallbackIconUrl(skill)
                        }}
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
