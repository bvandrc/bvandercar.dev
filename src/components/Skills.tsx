import { SKILLS } from '@/generated/profile/content/skills'
import type { SkillBadge } from '@/generated/profile/content/types'
import { cn } from '@/utils'
import { Section } from './primitives/Section'

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

/**
 * The Simple Icons URL for a skill's logo, in its brand color.
 *
 * The color comes from its shields.io badge: the logo color where that's a
 * real color, else the badge's background, since a white or black logo was
 * only ever drawn on that. One too dark for the chip uses the chip's ink.
 */
// Shields accepts slug aliases like `tailwind-css`; Simple Icons doesn't.
const skillIconSlug = ({ logo }: SkillBadge) =>
  logo.toLowerCase().replaceAll('-', '')

const skillIconUrl = (skill: SkillBadge) => {
  const { logoColor, path } = skill
  const logoHex = decodeURIComponent(logoColor).replace('#', '')
  const badgeHex = decodeURIComponent(path).match(
    /-#?([0-9a-f]{6})(?:\.svg)?$/i
  )?.[1]
  const brand = /^[0-9a-f]{6}$/i.test(logoHex) ? logoHex : badgeHex
  const color =
    brand && contrast(brand, CHIP_BACKGROUND) >= MIN_ICON_CONTRAST
      ? brand
      : CHIP_INK
  return `https://cdn.simpleicons.org/${skillIconSlug(skill)}/${color}`
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
        align="start"
        // From sm up, start the heading where the skills column does: past
        // the 9rem label column and the 1.25rem gap.
        headingClassName="sm:pl-[10.25rem]"
        // From sm up, as wide as the table below (its two columns and gap),
        // so the heading's offset lines up with the table's skills column.
        className="flex flex-col gap-3 sm:mx-auto sm:w-full sm:max-w-[42.25rem]">
        <dl
          className={cn(
            'flex flex-col gap-4',
            // From sm up, a two-column table like the README's, with the same
            // columns in every group so they line up: labels right-aligned, skills beside.
            'sm:mx-auto sm:grid sm:grid-cols-[9rem_minmax(0,32rem)] sm:items-center sm:gap-x-5 sm:gap-y-3'
          )}>
          {group.rows.map((row) => {
            // The label's line breaks are for the README's narrow column.
            const label = row.label.replaceAll('\n', ' ')
            return (
              // Below sm, a label sits above its skills; from sm up, the row's
              // two cells join the table's grid.
              <div
                key={label}
                className="flex flex-col items-center gap-2 sm:contents">
                <dt className="text-sm text-ink-muted sm:text-right">
                  {label}
                </dt>
                <dd className="flex flex-wrap justify-center gap-2 sm:justify-start">
                  {row.lines.flat().map((skill) => (
                    <span
                      key={skill.alt}
                      className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-sm">
                      <img
                        src={skillIconUrl(skill)}
                        alt=""
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
