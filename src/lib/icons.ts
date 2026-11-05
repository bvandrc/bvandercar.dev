import { uniq } from 'es-toolkit'

import { TYPE_ICONS } from '@/generated/profile/content/project-types'
import { PROJECTS } from '@/generated/profile/content/projects'
import {
  SECTIONS,
  type SectionHeading,
} from '@/generated/profile/content/sections'
import { SKILLS, type SkillBadge } from '@/generated/profile/content/skills'

/** The logo beside the header's GitHub link. */
export const GITHUB_ICON_SLUG = 'github'

/** The logo beside the header's LinkedIn link. */
export const LINKEDIN_ICON_SLUG = 'linkedin'

/** A skill badge's logo as a Simple Icons slug. */
export const skillIconSlug = ({ logo }: SkillBadge) =>
  // Shields accepts slug aliases like `tailwind-css`; Simple Icons doesn't.
  logo.toLowerCase().replaceAll('-', '')

/** Every interface glyph the site's own code draws, by its Lucide name. */
export const UI_ICON_NAMES = ['chevron-right', 'external-link'] as const

export type UiIconName = (typeof UI_ICON_NAMES)[number]

/** The glyphs the profile content gives the section headings. */
export const SECTION_GLYPHS = uniq(
  Object.values(SECTIONS).flatMap(({ glyph }: SectionHeading) => glyph ?? [])
)

/** A glyph the build bundles: an interface glyph, or a section heading's. */
export type GlyphName = UiIconName | NonNullable<SectionHeading['glyph']>

/**
 * Every glyph the site shows, by its Iconify name.
 *
 * A name is Lucide's unless prefixed `material-symbols:`. The build bundles
 * exactly these, and fails on a name its set doesn't have.
 */
export const GLYPH_NAMES = uniq<GlyphName>([
  ...UI_ICON_NAMES,
  ...SECTION_GLYPHS,
])

/**
 * Every logo slug the site shows.
 *
 * The build bundles exactly these, so a component showing a logo has to take
 * its slug from somewhere listed here, or the logo renders nothing.
 */
export const ICON_SLUGS = uniq([
  GITHUB_ICON_SLUG,
  LINKEDIN_ICON_SLUG,
  ...Object.values(TYPE_ICONS).map(({ slug }) => slug),
  ...PROJECTS.flatMap(({ icon }) =>
    typeof icon === 'string' ? [] : icon.slug
  ),
  ...SKILLS.flatMap(({ rows }) => rows)
    .flatMap(({ lines }) => lines.flat())
    .map(skillIconSlug),
])
