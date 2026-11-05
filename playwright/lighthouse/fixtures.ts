import { withLighthouse } from 'lighthouse-audit-utils/playwright'

export const lighthouseTest = withLighthouse({
  basePort: 9222,
  lighthouseArgs: {
    flags: { disableStorageReset: true, output: ['html', 'json'] },
    config: { extends: 'lighthouse:default' },
  },
  thresholds: {
    performance: 95,
    accessibility: 100,
    'best-practices': 100,
    seo: 100,
    'agentic-browsing': 100,
  },
})
