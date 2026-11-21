import { useState } from 'react'
import type { UrlHashTarget } from '@bvandrc/react-toolkit'

import { List } from '@/components/primitives/List'
import { Section, SubSection } from '@/components/Section'
import type { ProjectSection } from '@/generated/profile/content/projects'
import { PROJECTS } from '@/generated/profile/content/projects'
import { SECTIONS } from '@/generated/profile/content/sections'
import { getAnchorId } from '@/lib/anchor-id'
import { cn } from '@/lib/cn'
import { ProjectCard } from './ProjectCard'

type GridLayout = 'PREVIEW' | 'PAIRS'

// A group with a live preview takes the full width, so the page inside it has
// room; the rest pair up from md.
const GRID_CLASSES = {
  PREVIEW: 'grid gap-4',
  PAIRS: 'grid gap-4 md:grid-cols-2',
} satisfies Record<GridLayout, string>

/** How a group's cards are laid out: full width where any has a live preview. */
const getGridLayout = ({ projects }: ProjectSection): GridLayout =>
  projects.some(({ embed }) => embed) ? 'PREVIEW' : 'PAIRS'

/** The `#`'s parameter that opens its card's counts' charts, as in `/#task-rankr?show_charts=true`. */
const CHARTS_PARAM = 'show_charts'

type ProjectsProps = {
  /** What the URL's `#` named, once the page has landed on it, whose card opens its counts' charts where it asks. */
  urlTarget: UrlHashTarget | undefined
}

export const Projects = ({ urlTarget }: ProjectsProps) => {
  // Every preview toggle pulses on each page visit, until any one is opened.
  const [previewOpened, setPreviewOpened] = useState(false)
  const chartsOpenFor =
    urlTarget?.params.get(CHARTS_PARAM) === 'true' ? urlTarget.id : undefined
  return (
    <Section
      glyph={SECTIONS.PROJECTS.glyph}
      title={SECTIONS.PROJECTS.title}
      data-testid="projects">
      {PROJECTS.map((group) => {
        const layout = getGridLayout(group)
        return (
          <SubSection
            key={group.title}
            // React Websites has its logo and no glyph; every other group, a glyph.
            icon={group.glyph ?? group.icon}
            title={group.title}>
            {group.intro && (
              <p
                className={cn(
                  'font-semibold text-ink-muted',
                  // A size down on a phone, like the page's own intro, so it
                  // reads below its heading rather than as another.
                  'text-sm sm:text-base'
                )}>
                {group.intro}
              </p>
            )}
            <List className={GRID_CLASSES[layout]}>
              {group.projects.map((project) => (
                <li key={project.repo}>
                  <ProjectCard
                    project={project}
                    centered={layout === 'PREVIEW'}
                    pulsePreview={!previewOpened}
                    onPreviewOpen={() => setPreviewOpened(true)}
                    openCounts={
                      chartsOpenFor !== undefined &&
                      getAnchorId(project.name) === chartsOpenFor
                    }
                  />
                </li>
              ))}
            </List>
          </SubSection>
        )
      })}
    </Section>
  )
}
