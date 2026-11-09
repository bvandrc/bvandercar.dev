import { PROJECTS } from '@/generated/profile/content/projects'
import { SECTIONS } from '@/generated/profile/content/sections'
import { sectionAnchor } from '@/lib/section-anchor'
import { Badge } from './primitives/Badge'
import { Icon } from './primitives/Icon'
import { Link } from './primitives/Link'
import { List } from './primitives/List'
import { SubSectionIcon } from './Section'

type ContentsLinkProps = {
  /** The title of the section it goes to, which also names its anchor. */
  title: string
  /** The section heading's own icon, and decorative. */
  icon: React.ReactNode
}

/** A chip linking to one section further down the page. */
const ContentsLink = ({ title, icon }: ContentsLinkProps) => (
  <li>
    <Badge
      asChild
      // Glows orange on hover, like the skills.
      className="hover-glow-12">
      <Link
        href={`#${sectionAnchor(title)}`}
        tone="muted"
        data-testid="contents-link">
        {icon}
        {title}
      </Link>
    </Badge>
  </li>
)

/** Links to each project group, and to the skills, for a jump past the rest. */
export const Contents = () => (
  <nav aria-label="Contents" data-testid="contents">
    <List className="flex flex-wrap justify-center gap-2">
      {PROJECTS.map((group) => (
        <ContentsLink
          key={group.title}
          title={group.title}
          icon={
            <SubSectionIcon
              icon={group.glyph ?? group.icon}
              className="size-4"
            />
          }
        />
      ))}
      <ContentsLink
        title={SECTIONS.SKILLS.title}
        icon={
          <Icon
            name={SECTIONS.SKILLS.glyph}
            className="size-4 shrink-0 text-orange-400"
          />
        }
      />
    </List>
  </nav>
)
