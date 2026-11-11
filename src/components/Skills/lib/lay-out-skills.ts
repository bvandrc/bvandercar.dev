import { clamp } from 'es-toolkit'

import { measureFlexLines } from '@/lib/flex-lines'

type Span = { left: number; right: number }

const centerOf = ({ left, right }: Span) => (left + right) / 2

const shift = (element: HTMLElement, px: number) => {
  element.style.translate = px === 0 ? '' : `${px}px`
}

const findRows = (list: HTMLElement) =>
  Array.from(list.children).flatMap((row) => {
    const label = row.querySelector('dt')
    const skills = row.querySelector('dd')
    return label === null || skills === null ? [] : [{ label, skills }]
  })

/**
 * Centers a group of skills under its heading, by shifting it and its
 * wrapped lines of badges sideways; neither changes where a row wraps.
 *
 * `list` holds the group's rows, each a label (`dt`, its text in a child
 * element) and a wrapping flex box of badges (`dd`) whose lines start by it.
 * From sm up, the group centers on its first row's first line, and each line
 * a row wraps onto centers under that row's first. Below sm, it centers on
 * its labels and first lines together, and each wrapped line centers on the
 * page.
 */
export const layOutSkills = (list: HTMLElement, isMobile: boolean) => {
  const area = list.parentElement?.getBoundingClientRect()
  if (area === undefined) {
    return
  }
  const rows = findRows(list)
  // Measures everything where its layout puts it, with no shifts of the
  // last call's.
  shift(list, 0)
  for (const { skills } of rows) {
    for (const badge of skills.children) {
      if (badge instanceof HTMLElement) {
        shift(badge, 0)
      }
    }
  }

  const measured = rows.flatMap(({ label, skills }) => {
    const [first, ...wrapped] = measureFlexLines(skills)
    // The text, not the label, which runs past a short one's start.
    const text = label.firstElementChild?.getBoundingClientRect()
    return first === undefined || text === undefined
      ? []
      : [{ first, wrapped, textLeft: text.left }]
  })
  const [lead] = measured
  if (lead === undefined) {
    return
  }
  // All the group shows but its wrapped lines, which land inside it.
  const content = {
    left: Math.min(...measured.map(({ textLeft }) => textLeft)),
    right: Math.max(...measured.map(({ first }) => first.right)),
  }
  const center = centerOf(area)
  // As far as keeps all it shows on screen, though the list's empty edge may
  // not be, so clip the parent's overflow.
  const listShift = clamp(
    Math.round(center - centerOf(isMobile ? content : lead.first)),
    Math.ceil(area.left - content.left),
    Math.floor(area.right - content.right)
  )
  shift(list, listShift)

  for (const { first, wrapped } of measured) {
    for (const line of wrapped) {
      const offset = isMobile
        ? // On the page, not the first line, which the labels push right.
          center - listShift - centerOf(line)
        : // On the first line, or where it starts, for a line wider than it.
          Math.max(centerOf(first) - centerOf(line), first.left - line.left)
      for (const badge of line.items) {
        shift(badge, Math.round(offset))
      }
    }
  }
}
