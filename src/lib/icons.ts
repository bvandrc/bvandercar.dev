import { uniq } from 'es-toolkit'

import { COUNT_KINDS } from '@/generated/profile/content/counts'
import { TYPE_ICONS } from '@/generated/profile/content/project-types'
import { PROJECTS } from '@/generated/profile/content/projects'
import {
  SECTIONS,
  type SectionHeading,
} from '@/generated/profile/content/sections'
import { SKILLS, type SkillBadge } from '@/generated/profile/content/skills'

/** A skill badge's logo as a Simple Icons slug. */
export const skillIconSlug = ({ logo }: SkillBadge) =>
  // Shields accepts slug aliases like `tailwind-css`; Simple Icons doesn't.
  logo.toLowerCase().replaceAll('-', '')

/** Every interface glyph and logo the site's own code draws, by its Iconify name. */
export const UI_ICON_NAMES = [
  'chevron-right',
  'code-xml',
  'external-link',
  'simple-icons:github',
  'simple-icons:linkedin',
] as const

export type UiIconName = (typeof UI_ICON_NAMES)[number]

/** The glyphs the profile content gives the section and group headings. */
export const SECTION_GLYPHS = uniq([
  ...Object.values(SECTIONS).flatMap(
    ({ glyph }: SectionHeading) => glyph ?? []
  ),
  ...[...PROJECTS, ...SKILLS].flatMap(({ glyph }) => glyph?.name ?? []),
])

/** A glyph the build bundles: an interface glyph, a heading's, or a project count's. */
export type GlyphName = UiIconName | NonNullable<SectionHeading['glyph']>

/**
 * Every glyph the site shows, by its Iconify name.
 *
 * A name is Lucide's unless prefixed `material-symbols:` or `simple-icons:`. The build bundles
 * exactly these, and fails on a name its set doesn't have.
 */
export const GLYPH_NAMES = uniq<GlyphName>([
  ...UI_ICON_NAMES,
  ...SECTION_GLYPHS,
  ...COUNT_KINDS.map(({ icon }) => icon),
])

/**
 * Every logo slug the site shows.
 *
 * The build bundles exactly these, so a component showing a logo has to take
 * its slug from somewhere listed here, or the logo renders nothing.
 */
export const ICON_SLUGS = uniq([
  ...Object.values(TYPE_ICONS).map(({ slug }) => slug),
  ...PROJECTS.flatMap(({ icon }) =>
    typeof icon === 'string' ? [] : icon.slug
  ),
  ...SKILLS.flatMap(({ rows }) => rows)
    .flatMap(({ lines }) => lines.flat())
    .map(skillIconSlug),
])
