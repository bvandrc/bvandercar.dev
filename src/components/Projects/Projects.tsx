import { useState } from 'react'

import { List } from '@/components/primitives/List'
import { Section, SubSection } from '@/components/Section'
import type { ProjectSection } from '@/generated/profile/content/projects'
import { PROJECTS } from '@/generated/profile/content/projects'
import { SECTIONS } from '@/generated/profile/content/sections'
import { sectionAnchor } from '@/lib/section-anchor'
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

export const Projects = () => {
  // Every preview toggle pulses on each page visit, until any one is opened.
  const [previewOpened, setPreviewOpened] = useState(false)
  return (
    <Section
      glyph={SECTIONS.PROJECTS.glyph}
      title={SECTIONS.PROJECTS.title}
      id={sectionAnchor(SECTIONS.PROJECTS.title)}
      data-testid="projects">
      {PROJECTS.map((group) => {
        const layout = getGridLayout(group)
        return (
          <SubSection
            key={group.title}
            id={sectionAnchor(group.title)}
            // React Websites has its logo and no glyph; every other group, a glyph.
            icon={group.glyph ?? group.icon}
            title={group.title}>
            {group.intro && (
              <p className="font-semibold text-ink-muted">{group.intro}</p>
            )}
            <List className={GRID_CLASSES[layout]}>
              {group.projects.map((project) => (
                <li key={project.repo}>
                  <ProjectCard
                    project={project}
                    centered={layout === 'PREVIEW'}
                    pulsePreview={!previewOpened}
                    onPreviewOpen={() => setPreviewOpened(true)}
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
