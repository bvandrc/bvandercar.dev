import { useIntersectionObserver } from 'usehooks-ts'

import { List } from '../primitives/List'
import { ContentsBar } from './ContentsBar'
import { CONTENTS_ENTRIES, ContentsLink } from './ContentsLink'

/**
 * Links to each project group, and to the skills, for a jump past the rest.
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
  return (
    <>
      <nav ref={ref} aria-label="Contents" data-testid="contents">
        <List className="flex flex-wrap justify-center gap-2">
          {CONTENTS_ENTRIES.map((contentsEntry) => (
            <ContentsLink
              key={contentsEntry.title}
              {...contentsEntry}
              data-testid="contents-link"
            />
          ))}
        </List>
      </nav>
      <ContentsBar shown={clippedAtTop} />
    </>
  )
}
