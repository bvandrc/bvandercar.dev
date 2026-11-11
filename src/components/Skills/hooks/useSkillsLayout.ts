import { useIsomorphicLayoutEffect } from 'usehooks-ts'

import { layOutSkills } from '../lib/lay-out-skills'

/**
 * Lays out a group of skills with `layOutSkills`, before the browser paints,
 * and again when the group or its parent resizes or a font loads.
 */
export const useSkillsLayout = (
  ref: React.RefObject<HTMLElement | null>,
  isMobile: boolean
) => {
  useIsomorphicLayoutEffect(() => {
    const list = ref.current
    if (list === null) {
      return
    }
    const layOut = () => layOutSkills(list, isMobile)
    layOut()
    // A shift never changes a size, so laying out never sets this off again.
    const observer = new ResizeObserver(layOut)
    observer.observe(list)
    if (list.parentElement !== null) {
      observer.observe(list.parentElement)
    }
    const { fonts } = document
    fonts?.addEventListener('loadingdone', layOut)
    return () => {
      observer.disconnect()
      fonts?.removeEventListener('loadingdone', layOut)
    }
  }, [ref, isMobile])
}
