import { cn } from '@/lib/cn'
import { formatDay } from '@/lib/format-date'
import { getRepoUrl } from '~/github'
import { ProjectTotals } from './Projects'
import { Icon } from './primitives/Icon'
import { Link } from './primitives/Link'
import { SocialLinks } from './SocialLinks'

/**
 * Items the footer keeps on one row together, spaced as its own items are.
 *
 * They break only where the group is wider than the footer itself, as the links are on the narrowest phones.
 */
const GROUP_CLASSES =
  'flex flex-wrap items-center justify-center gap-x-6 gap-y-2'

/** The page's foot: my profiles again, every project's counts added up, the site's source, and the day it was built. */
export const Footer = () => {
  const buildDate = import.meta.env.BUILD_DATE
  return (
    <footer
      className={cn(
        'border-t border-border pt-3 text-xs text-ink-muted',
        // One row where it fits, wrapping onto more between its groups on a narrow screen.
        'flex flex-wrap items-center justify-center gap-x-6 gap-y-2',
        // With the column's own gap, as far below the last section as the sections are apart.
        'mt-4'
      )}
      data-testid="footer">
      {/* The totals wrap below the links rather than beside the source and build date, so those
          two get a row of their own wherever the footer takes more than one. */}
      <div className={GROUP_CLASSES}>
        <div className={GROUP_CLASSES}>
          <SocialLinks tone="muted" />
        </div>
        <ProjectTotals />
      </div>
      <div className={GROUP_CLASSES}>
        <Link
          href={getRepoUrl('bvandercar.dev')}
          tone="muted"
          newTab
          className="inline-flex items-center gap-2"
          data-testid="footer-source-link">
          <Icon name="code-xml" />
          Source on GitHub
        </Link>
        <p>
          Built{' '}
          <time dateTime={buildDate} data-testid="footer-build-date">
            {formatDay(buildDate)}
          </time>
        </p>
      </div>
    </footer>
  )
}
