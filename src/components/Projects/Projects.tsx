import { useState } from 'react'

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

/** The query parameter that opens the charts of the card a URL's `#` names, as in `/?charts#task-rankr`. */
const CHARTS_PARAM = 'charts'

type ProjectsProps = {
  /** The id the page landed on from the URL's `#`, whose card opens its counts' charts where the URL asks. */
  urlTargetId: string | undefined
}

export const Projects = ({ urlTargetId }: ProjectsProps) => {
  // Every preview toggle pulses on each page visit, until any one is opened.
  const [previewOpened, setPreviewOpened] = useState(false)
  const chartsOpenFor = new URLSearchParams(window.location.search).has(
    CHARTS_PARAM
  )
    ? urlTargetId
    : undefined
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
