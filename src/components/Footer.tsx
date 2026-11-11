import { cn } from '@/lib/cn'
import { formatDay } from '@/lib/format-date'
import { getRepoUrl } from '~/github'
import { ProjectTotals } from './Projects'
import { Icon } from './primitives/Icon'
import { Link } from './primitives/Link'
import { SocialLinks } from './SocialLinks'

/** The page's foot: my profiles again, the site's source, every project's counts added up, and the day it was built. */
export const Footer = () => {
  const buildDate = import.meta.env.BUILD_DATE
  return (
    <footer
      className={cn(
        'border-t border-border pt-3 text-xs text-ink-muted',
        // One row where it fits, wrapping onto more on a narrow screen.
        'flex flex-wrap items-center justify-center gap-x-6 gap-y-2',
        // With the column's own gap, as far below the last section as the sections are apart.
        'mt-4'
      )}
      data-testid="footer">
      <SocialLinks tone="muted" />
      <Link
        href={getRepoUrl('bvandercar.dev')}
        tone="muted"
        newTab
        className="inline-flex items-center gap-2"
        data-testid="footer-source-link">
        <Icon name="code-xml" />
        Source on GitHub
      </Link>
      <ProjectTotals />
      <p>
        Built{' '}
        <time dateTime={buildDate} data-testid="footer-build-date">
          {formatDay(buildDate)}
        </time>
      </p>
    </footer>
  )
}
