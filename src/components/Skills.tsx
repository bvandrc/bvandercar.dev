import { SKILLS } from '@/generated/profile/content/skills'
import { cn } from '@/utils'
import { Section } from './Section'

export const Skills = () => (
  <Section emoji="🌟" title="Skills" data-testid="skills">
    {SKILLS.map((group) => (
      <Section
        key={group.title}
        emoji={group.emoji}
        title={group.title}
        level="h3"
        className="flex flex-col gap-3">
        <dl
          className={cn(
            'flex flex-col gap-4',
            // From sm up, a two-column table like the README's, with the same
            // columns in every group so they line up: labels right-aligned, skills beside.
            'sm:mx-auto sm:grid sm:grid-cols-[9rem_minmax(0,32rem)] sm:items-center sm:gap-x-5 sm:gap-y-3'
          )}>
          {group.rows.map((row) => {
            // The label's line breaks are for the README's narrow column.
            const label = row.label.replaceAll('\n', ' ')
            return (
              // Below sm, a label sits above its skills; from sm up, the row's
              // two cells join the table's grid.
              <div
                key={label}
                className="flex flex-col items-center gap-2 sm:contents">
                <dt className="text-sm text-ink-muted sm:text-right">
                  {label}
                </dt>
                <dd className="flex flex-wrap justify-center gap-2 sm:justify-start">
                  {row.lines.flat().map((skill) => (
                    <span
                      key={skill.alt}
                      className="rounded-md border border-border bg-surface px-2 py-1 text-sm">
                      {skill.alt}
                    </span>
                  ))}
                </dd>
              </div>
            )
          })}
        </dl>
      </Section>
    ))}
  </Section>
)
