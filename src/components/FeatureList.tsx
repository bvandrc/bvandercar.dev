import { FeatureStatus } from '@/constants'
import type { Feature } from '@/types'
import { Badge, type BadgeTone } from './primitives/Badge'
import { Card } from './primitives/Card'

const FEATURES: Feature[] = [
  {
    name: 'Vite + React',
    description: 'TypeScript, fast refresh, and an esnext production build.',
    status: FeatureStatus.STABLE,
  },
  {
    name: 'Tailwind CSS',
    description: 'v4 via the Vite plugin, with theme tokens in index.css.',
    status: FeatureStatus.STABLE,
  },
  {
    name: 'Biome',
    description: 'Formatting, linting, and import sorting in a single pass.',
    status: FeatureStatus.STABLE,
  },
  {
    name: 'Playwright',
    description: 'End-to-end smoke tests on desktop and mobile viewports.',
    status: FeatureStatus.STABLE,
  },
  {
    name: 'axe accessibility scans',
    description: 'WCAG 2.1 AA scans of each meaningful UI state.',
    status: FeatureStatus.BETA,
  },
  {
    name: 'Lighthouse budgets',
    description: 'Score thresholds enforced in CI and against production.',
    status: FeatureStatus.BETA,
  },
  {
    name: 'GitHub Pages deploy',
    description:
      'Build, check, and publish on every push to the default branch.',
    status: FeatureStatus.STABLE,
  },
  {
    name: 'Offline support',
    description: 'A service worker and web app manifest are not set up yet.',
    status: FeatureStatus.PLANNED,
  },
]

const STATUS_TONES = {
  [FeatureStatus.STABLE]: 'positive',
  [FeatureStatus.BETA]: 'caution',
  [FeatureStatus.PLANNED]: 'neutral',
} as const satisfies Record<FeatureStatus, BadgeTone>

export const FeatureList = () => (
  <section className="flex flex-col gap-5" data-testid="feature-list">
    <h2 className="text-xl font-semibold">What's included</h2>
    <ul className="grid gap-4 md:grid-cols-2">
      {FEATURES.map(({ name, description, status }) => (
        <li key={name}>
          <Card
            className="flex h-full flex-col gap-2"
            data-testid="feature-card">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-medium" data-testid="feature-card-name">
                {name}
              </h3>
              <Badge
                tone={STATUS_TONES[status]}
                data-testid="feature-card-status">
                {status}
              </Badge>
            </div>
            <p
              className="text-sm text-ink-muted"
              data-testid="feature-card-description">
              {description}
            </p>
          </Card>
        </li>
      ))}
    </ul>
  </section>
)
