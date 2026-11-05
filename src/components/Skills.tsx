import { SKILLS } from '@/generated/profile/content/skills'
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
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[8rem_1fr]">
          {group.rows.map((row) => {
            // The label's line breaks are for the README's narrow column.
            const label = row.label.replaceAll('\n', ' ')
            return (
              <div key={label} className="contents">
                <dt className="text-sm text-ink-muted sm:pt-1">{label}</dt>
                <dd className="flex flex-wrap gap-2">
                  {row.lines.flat().map((skill) => (
                    <span
                      key={skill.alt}
                      className="rounded-md border border-border bg-surface px-2 py-1 text-sm"
                      data-testid="skill-chip">
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
