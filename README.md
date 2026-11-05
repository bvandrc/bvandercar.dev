# React Frontend Template

A starting point for a static React frontend deployed to GitHub Pages.

- **Vite 8** + **React 18** + **TypeScript**
- **Tailwind CSS 4** via `@tailwindcss/vite`, with theme tokens in [src/styles/index.css](src/styles/index.css)
- **Biome** for formatting, linting, and import sorting
- **Vitest** + **Testing Library** for unit and component tests
- **Playwright** suites for end-to-end, accessibility (axe), and Lighthouse checks
- **GitHub Actions** for CI, GitHub Pages deploys, and post-deploy Lighthouse audits

The committed app is a placeholder. Replace it with your own.

## Scripts

| Script                 | What it does                                       |
| ---------------------- | -------------------------------------------------- |
| `pnpm dev`             | Vite dev server on port 5000                       |
| `pnpm build`           | Production build into `dist`                       |
| `pnpm preview`         | Build, then serve `dist`                           |
| `pnpm check`           | Format + lint + type check (app and Playwright)    |
| `pnpm test`            | Vitest unit tests, once                            |
| `pnpm test:watch`      | Vitest in watch mode                               |
| `pnpm test:e2e`        | End-to-end smoke tests                             |
| `pnpm test:a11y`       | axe scans, desktop and mobile viewports            |
| `pnpm test:lighthouse` | Lighthouse audits against the local preview server |
| `pnpm pw:open`         | Playwright UI mode                                 |
| `pnpm pw:report`       | Open the last HTML report                          |

The Playwright suites run against `vite preview`, so build first (`pnpm build`) and start it with `pnpm preview:ci`, or let CI do it.

## Layout

```
.github/
  actions/
    setup/            Composite action: pnpm + Node + install
    setup-playwright/ Composite action: Playwright browser cache + install
  workflows/      CI, PR-only CI, deploy, and production Lighthouse
public/
  CNAME           Custom domain for GitHub Pages (only needed for GH pages)
  favicon.svg     Browser tab icon
  logo.svg        In-app logo
  preview.svg     og:image / social preview
  robots.txt      Crawler rules
  sitemap.xml     Sitemap
  llms.txt        LLM-readable site summary
src/
  components/
    primitives/   Presentational building blocks (Button, Card, Badge)
    ...           Feature components composed from primitives
    __tests__/    Unit tests, beside the modules they cover (in every src/ folder)
  constants/      Shared enums and constants
  hooks/          camelCase files, e.g. useMobile.ts
  styles/         Tailwind entrypoint and theme tokens
  types/          Shared types
  utils/          Shared helpers
playwright/
  e2e/            e2e tests
  a11y/           axe accessibility tests
  lighthouse/     google lighthouse tests
shared/
  test-support/   Test helpers either suite can import
    selectors.ts  The data-testid registry
tsconfig.json     App TypeScript config
vite.config.ts    Vite config (port, Tailwind plugin, build options)
vitest.config.ts  Vitest config (happy-dom, globals, aliases)
biome.jsonc       Formatter, linter, and import sorter config
index.html        HTML entry point (title, meta, og tags)
```

## CI

- **CI** — lint, type check, unit tests, and the three Playwright suites on every push and PR
- **PR CI** — pull-request-only jobs: the changed-line count, written to the run's job summary
- **Deploy** — build and publish `dist` to GitHub Pages on the default branch
- **Production Lighthouse** — audits the live site 15 minutes after each deploy
