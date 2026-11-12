import { PROJECTS } from '@/generated/profile/content/projects'
import { SECTIONS } from '@/generated/profile/content/sections'
import { cn } from '@/lib/cn'
import { sectionAnchor } from '@/lib/section-anchor'
import { Badge } from '../primitives/Badge'
import { Link, type LinkProps } from '../primitives/Link'
import { SectionIcon, SubSectionIcon } from '../Section'

export type ContentsEntry = {
  /** The id of the section it goes to. */
  sectionId: string
  /**
   * Whether it keeps its chip in the reduced contents, on a narrow screen.
   * Without one there, the bar's menu, which lists every section, still links
   * to it.
   */
  inReducedContents: boolean
  /** The title of the section it goes to. */
  title: string
  /** The section heading's own icon, and decorative. */
  icon: React.ReactNode
}

/** Each project group, then the skills: the sections the contents link to. */
export const CONTENTS_ENTRIES: readonly ContentsEntry[] = [
  ...PROJECTS.map((group) => ({
    sectionId: sectionAnchor(group.title),
    title: group.title,
    inReducedContents: group.inReducedContents ?? true,
    icon: (
      <SubSectionIcon icon={group.glyph ?? group.icon} className="size-4" />
    ),
  })),
  {
    sectionId: sectionAnchor(SECTIONS.SKILLS.title),
    title: SECTIONS.SKILLS.title,
    inReducedContents: true,
    // Gold, not the orange of every top-level section's heading: among the
    // project groups' own colors, an orange Skills reads as the odd one out.
    icon: (
      <SectionIcon
        glyph={SECTIONS.SKILLS.glyph}
        className="size-4 text-amber-400"
      />
    ),
  },
]

/** The id of each section in `CONTENTS_ENTRIES`, in the same order. */
export const CONTENTS_SECTION_IDS = CONTENTS_ENTRIES.map(
  ({ sectionId }) => sectionId
)

type ContentsLinkProps = Omit<ContentsEntry, 'inReducedContents'> &
  Pick<LinkProps, 'onClick'> & {
    /** Marks it as the section the reader is in now. */
    current?: boolean
    /** Classes for the chip itself. */
    className?: string
    'data-testid': string
  }

/** A chip linking to one section further down the page. */
export const ContentsLink = ({
  sectionId,
  title,
  icon,
  current = false,
  className,
  onClick,
  'data-testid': testId,
}: ContentsLinkProps) => (
  <li>
    <Badge
      asChild
      className={cn(
        // Glows orange on hover, like the skills.
        'hover-glow-12',
        // Outlined in the same orange while its section is the one in view.
        'aria-[current=location]:border-orange-400 aria-[current=location]:text-ink',
        className
      )}>
      <Link
        href={`#${sectionId}`}
        tone="muted"
        aria-current={current ? 'location' : undefined}
        onClick={onClick}
        data-testid={testId}>
        {icon}
        {title}
      </Link>
    </Badge>
  </li>
)
