# bvandercar.dev

My personal developer site: skills, projects, and a little about me. Live at <https://bvandercar.dev/>, served by Cloudflare.

Built on:

- **Vite 8** + **React 19** + **TypeScript**
- **Tailwind CSS 4** via `@tailwindcss/vite`, with theme tokens in [src/styles/index.css](src/styles/index.css)
- **Biome** for formatting, linting, and import sorting
- **Vitest** + **Testing Library** for unit and component tests
- **Playwright** suites for end-to-end, accessibility (axe), and Lighthouse checks
- **GitHub Actions** for CI, Cloudflare deploys, and post-deploy Lighthouse audits

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Vite dev server on port 5000 |
| `pnpm build` | Production build into `dist` |
| `pnpm preview` | Build, then serve `dist` |
| `pnpm icons` | Generate favicon.ico and the PNG icons into `public/` |
| `pnpm fetch:content` | Both fetches below, which `dev`, `build`, `check`, and `test` run first |
| `pnpm fetch:profile` | Fetch the profile content and screenshots from bvandrc/bvandrc |
| `pnpm fetch:downloads` | Fetch each npm and PyPI package's weekly downloads, for the chart in its counts tooltip; PyPI's need `GOOGLE_APPLICATION_CREDENTIALS` |
| `pnpm check` | Format + lint + type check (app and Playwright) |
| `pnpm test` | Vitest unit tests, once |
| `pnpm test:watch` | Vitest in watch mode |
| `pnpm test:e2e` | End-to-end smoke tests |
| `pnpm test:a11y` | axe scans, desktop and mobile viewports |
| `pnpm test:lighthouse` | Lighthouse audits against the local preview server |
| `pnpm pw:open` | Playwright UI mode |
| `pnpm pw:report` | Open the last HTML report |

The Playwright suites run against `vite preview`, so build first (`pnpm build`) and start it with `pnpm preview:ci`, or let CI do it.

## Layout

```
.github/
  actions/
    setup/            Composite action: pnpm + Node + install
    setup-playwright/ Composite action: Playwright browser cache + install
  workflows/      CI, PR-only CI, deploy, and production Lighthouse
public/
  favicon.svg     Browser tab icon, and the source for the icons `pnpm icons` generates here
  site.webmanifest  Web app manifest (name, colors, and icons)
  logo.svg        In-app logo
  preview.png     og:image / social preview card (1200×630)
  robots.txt      Crawler rules
  sitemap.xml     Sitemap
  llms.txt        LLM-readable site summary
src/
  components/
    primitives/   Presentational building blocks (Button, Card, Badge)
    ...           Page sections composed from primitives
    __tests__/    Unit tests, beside the modules they cover (in every src/ folder)
  hooks/          camelCase files, e.g. useMobile.ts
  styles/         Tailwind entrypoint and theme tokens
  utils/          Shared helpers
scripts/
  fetch-profile.ts   Fetches the profile content (src/generated/profile/) and screenshots from bvandrc/bvandrc
  fetch-downloads.ts Fetches each package's weekly downloads (src/generated/package-downloads.ts) from npm and BigQuery
playwright/
  e2e/            e2e tests
  a11y/           axe accessibility tests
  lighthouse/     google lighthouse tests
shared/
  test-support/   Test helpers either suite can import
    selectors.ts  The data-testid registry
tsconfig.json     App TypeScript config
wrangler.jsonc    Cloudflare Workers config (assets directory, custom domain)
pwa-assets.config.ts  Icon generator config (preset, padding, background)
vite.config.ts    Vite config (port, Tailwind plugin, build options)
vitest.config.ts  Vitest config (happy-dom, globals, aliases)
biome.jsonc       Formatter, linter, and import sorter config
index.html        HTML entry point (title, meta, og tags)
```

## CI

- **CI** — lint, type check, unit tests, and the three Playwright suites on every push and PR, and weekly so the site redeploys with fresh profile content
- **PR CI** — pull-request-only jobs: the changed-line count, written to the run's job summary
- **Deploy** — once CI passes on the default branch, build and publish `dist` to Cloudflare with Wrangler
- **Preview** — on every PR, upload the build as a Cloudflare version (not deployed) and link its preview URL from the PR's "View deployment" button, stable per PR as `pr-<number>`
- **Production Lighthouse** — audits the live site 15 minutes after each deploy
