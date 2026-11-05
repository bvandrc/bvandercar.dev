## Project

Blake Vandercar's personal developer site — skills, projects, and a short "about me" — deployed to Cloudflare (Workers static assets, configured in `wrangler.jsonc`) by `.github/workflows/deploy.yml`.

- **Stack**: React 18 + Vite + TypeScript, Tailwind v4, Biome, Vitest + Testing Library for unit/component tests, Playwright for e2e/a11y/Lighthouse.
- **Layout**: `src/` is the app, with unit tests in `__tests__/` folders beside the modules they cover; `playwright/` is the browser suites; `shared/test-support/` holds test helpers either suite can import, like the test-id registry in `selectors.ts` (alias `~/test-support/*`).
- **Base path**: `site.config.ts` holds `BASE_PATH`/`SITE_URL` and is imported by `vite.config.ts` and `playwright.config.ts`. The site is served from the domain root today, but in app code still build asset URLs from `import.meta.env.BASE_URL` (see `Header.tsx`) so they keep working if that ever changes.

## Code conventions

Conventions live outside this file, synced from https://github.com/bvandrc/bvandrc-conventions — follow all of them:

- @conventions/typescript.md — language-level TypeScript/JavaScript rules
- @conventions/react.md — component, JSX, and accessibility rules
- @conventions/ts-testing-all.md — testing rules shared by every TypeScript suite: test IDs, naming, assertions
- @conventions/playwright.md — test layout, test IDs, and accessibility scans
- @conventions/ts-unit-testing.md — TypeScript unit test layout, naming, fixtures, and assertions
- @conventions/all.md — practice for every repo: branches, formatting, comments, testing, writing, PR reviews

## Commands

- `pnpm dev` — dev server on port 5000. `pnpm build`, `pnpm preview`.
- `pnpm format` — Biome check/fix. `pnpm check` — the full gate: format plus `tsc` for the app and for `playwright/tsconfig.json`. Run before every commit; it's what CI runs.
- `pnpm test` — Vitest unit tests over `src/`. `pnpm test:watch` to re-run on a change; CI runs `pnpm test:unit`.
- `pnpm preview:ci` — build and serve on port 4173. All three Playwright suites expect this server to already be running.
- `pnpm test:e2e`, `pnpm test:a11y`, `pnpm test:lighthouse` — the three Playwright projects. `pnpm pw:open` for the UI runner.

## Repo conventions

- **Package manager**: pnpm. `npm install` writes a competing `package-lock.json` that CI ignores.
- **package.json**: Linted in CI by `bvandrc/lint-package-json`, which enforces top-level key order, alphabetical `dependencies` and `devDependencies`, and exact-semver `version`. Adding a field in the wrong place, or a dependency out of order, fails the lint job.
- **Convention files**: `conventions/` is synced from https://github.com/bvandrc/bvandrc-conventions and overwritten on every sync. Edit a rule upstream, never in that directory.
