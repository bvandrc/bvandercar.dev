import { BEYOND_CODE } from '@/generated/profile/content/about'
import { Section } from './primitives/Section'

export const BeyondCode = () => (
  <Section icon="🎉" title="Beyond Code" data-testid="beyond-code">
    <p className="text-ink-muted">{BEYOND_CODE.intro}</p>
    <ul className="flex flex-col gap-1">
      {BEYOND_CODE.lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  </Section>
)
