import { useIntersectionObserver } from 'usehooks-ts'

import { List } from '../primitives/List'
import { ContentsBar } from './ContentsBar'
import { CONTENTS_ENTRIES, ContentsLink } from './ContentsLink'

/**
 * Links to each project group, and to the skills, for a jump past the rest.
 *
 * Once they scroll off the top, the same links ride along in a bar pinned there.
 */
export const Contents = () => {
  const { ref, entry: observed } = useIntersectionObserver()
  // Off the top only: on a short screen, they can start out below the fold.
  const scrolledPast =
    observed !== undefined &&
    !observed.isIntersecting &&
    observed.boundingClientRect.top < 0
  return (
    <>
      <nav ref={ref} aria-label="Contents" data-testid="contents">
        <List className="flex flex-wrap justify-center gap-2">
          {CONTENTS_ENTRIES.map((entry) => (
            <ContentsLink
              key={entry.title}
              {...entry}
              data-testid="contents-link"
            />
          ))}
        </List>
      </nav>
      <ContentsBar shown={scrolledPast} />
    </>
  )
}
