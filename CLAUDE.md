## Project

Blake Vandercar's personal developer site — skills, projects, and a short "about me" — deployed to Cloudflare (Workers static assets, configured in `wrangler.jsonc`) by `.github/workflows/deploy.yml`. Every PR also gets a preview URL, linked from its "View deployment" button by `.github/workflows/preview.yml`. Both build through `.github/actions/build-site`.

- **Stack**: React 19 + Vite + TypeScript, Tailwind v4, Radix UI primitives (`radix-ui`, wrapped in `src/components/primitives/`), Biome, Vitest + Testing Library for unit/component tests, Playwright for e2e/a11y/Lighthouse.
- **Layout**: `src/` is the app, with unit tests in `__tests__/` folders beside the modules they cover; `playwright/` is the browser suites; `shared/test-support/` holds test helpers either suite can import, like the test-id registry in `selectors.ts` (alias `~/test-support/*`).
- **Base path**: `site.config.ts` holds `BASE_PATH`/`SITE_URL` and is imported by `vite.config.ts` and `playwright.config.ts`. The site is served from the domain root today, but in app code still build asset URLs from `import.meta.env.BASE_URL` (see `Header.tsx`) so they keep working if that ever changes.
- **Security headers**: `SECURITY_HEADERS` in `site.config.ts` is the one source for the CSP and other headers. The build writes it to `dist/_headers` for Cloudflare, and `vite preview` sends it, so CI's ZAP scan, which runs on `main` but not on PRs, checks it. A new third-party script, font, image, frame, or request origin must be added to the CSP there, or the browser blocks it in production.
- **Profile content**: the intro, projects, skills, and "Beyond Code" come from [bvandrc/bvandrc](https://github.com/bvandrc/bvandrc), the source of the GitHub profile README. Edit content there, never here.
  - **Fetch**: `pnpm fetch:profile` (`scripts/fetch-profile.ts`) downloads its `src/content/*.ts` and `src/generated/repo-counts.ts` into `src/generated/profile/`, and the screenshots they reference into `public/project-screenshots/`, all gitignored.
  - **When**: `dev`, `build`, `check`, and `test` run it first, through `pnpm fetch:content`, since `tsc` and the components import those files. `fetch:content` then runs the counts' fetches below.
  - **Branch**: builds read `feat/bvandercar-dev-content`, named by `PROFILE_DEV_BRANCH` in that script, while it exists, so content changes land there rather than on bvandrc's `main`; once it's merged and deleted, they read `main`. Set `PROFILE_REF` to read another branch or commit for one run.
  - **Refresh**: CI also runs weekly, an hour after bvandrc refreshes its counts, so the site redeploys with fresh content.
- **Project counts**: each project card's glyphs show its repo's commits and PRs, and its package's downloads. The build fetches these totals itself, fresher than bvandrc's weekly `repo-counts.ts`, which stands in for any it couldn't fetch.
  - **Commits and PRs**: `pnpm fetch:git-activity` (`scripts/fetch-git-activity.ts`) counts each project `repo`'s from the GitHub API into `src/generated/repo-activity-totals.ts`. It needs `GITHUB_TOKEN` and skips every repo without one, so set it locally to see them (`GITHUB_TOKEN=$(gh auth token) pnpm dev`).
  - **Downloads**: `pnpm fetch:downloads` (`scripts/fetch-downloads.ts`, with a module per registry in `scripts/fetch-downloads/`) totals each `npmPackage`'s and `pypiPackage`'s downloads since its first publish into `src/generated/package-download-totals.ts`. npm's need no credentials.
  - **PyPI**: its downloads come from Google BigQuery's public PyPI dataset, queried only when `GOOGLE_APPLICATION_CREDENTIALS` is set, so local builds skip PyPI. A query bills at most 50 GB, and the build logs what it billed. The daily counts are kept in `.cache/pypi-downloads.json`, so a build queries only the days since the last, re-reading the latest 3; without that file, it queries the whole history, 180 days at a time, and keeps what it got if one fails.
  - **Credentials in CI**: CI's browser suites pass the workflow's own token, which reads only public repos. The deploy and preview builds pass `PROJECT_REPOS_TOKEN`, a read-only token for every project repo, private ones (TaskRankr, SD) included, and sign in to BigQuery with `BIGQUERY_CREDENTIALS`, a service account key.
  - **A count it can't fetch**: is left out with a warning, and bvandrc's count stands in. The deploy sets `REQUIRE_FETCHED_DATA=true`, which fails the build instead, so the live site never shows an older count.
  - **Reuse in previews**: a preview reuses the counts a preview or deploy fetched the same UTC day, with the same scripts. `build-site` caches `src/generated/` under the date and a hash of the fetch scripts, and `REUSE_FETCHED_DATA=true` makes the fetches keep the files it restored. A PR with the `refresh-data` label fetches fresh, and adding the label builds a preview. The deploy and preview builds also carry PyPI's daily counts between runs in the Actions cache.
  - **Scripts**: Node runs them directly, so they import their shared paths and helpers in `scripts/shared/` by their `.ts` names, which `allowImportingTsExtensions` in `tsconfig.json` lets `tsc` accept. Everything they write is gitignored.
- **Generated icons**: `favicon.ico` and the touch and manifest PNGs are not committed. `pnpm icons` (`@vite-pwa/assets-generator`, configured in `pwa-assets.config.ts`) writes them into `public/` from `public/favicon.svg`, and `pnpm dev` and `pnpm build` run it first. `.gitignore` keeps them out of git. Their links in `index.html` and entries in `public/site.webmanifest` are written by hand, so keep those in step with the preset's file names. The social preview, `public/preview.png`, is a committed image: update it by hand if the logo or tagline changes.

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
