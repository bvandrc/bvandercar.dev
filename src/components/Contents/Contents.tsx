import { useIntersectionObserver } from 'usehooks-ts'

import { List } from '../primitives/List'
import { ContentsBar } from './ContentsBar'
import { ContentsLink } from './ContentsLink'
import { useContentsChips } from './hooks/useContentsChips'

/**
 * Chips linking to the project groups and the skills, for a jump past the
 * rest. On a narrow screen, some groups go without.
 *
 * Once they start to scroll off the top, the same links ride along in a bar
 * pinned there, taking over before any are cut off.
 */
export const Contents = () => {
  // Out of full view, which the first px off the top is.
  const {
    ref,
    isIntersecting: fullyInView,
    entry,
  } = useIntersectionObserver({
    threshold: 1,
  })
  // Off the top only: on a short screen, they can start out below the fold.
  const clippedAtTop =
    entry !== undefined && !fullyInView && entry.boundingClientRect.top < 0
  const chips = useContentsChips()
  return (
    <>
      <nav ref={ref} aria-label="Contents" data-testid="contents">
        {/* Tighter on a phone, so they take two rows from 360px wide. */}
        <List className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
          {chips.map((contentsEntry) => (
            <ContentsLink
              key={contentsEntry.title}
              {...contentsEntry}
              className="px-1.5 sm:px-2"
              data-testid="contents-link"
            />
          ))}
        </List>
      </nav>
      <ContentsBar shown={clippedAtTop} />
    </>
  )
}
