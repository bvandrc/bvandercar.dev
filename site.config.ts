/**
 * Shared site config for the build (vite.config.ts), the test runner
 * (playwright.config.ts), and CI.
 */

/**
 * Path the site is served under, which every asset URL is prefixed with.
 *
 * GitHub Pages serves project sites from `https://<user>.github.io/<repo>/`,
 * hence the repo name. Set to `'/'` if the site moves to a custom domain or a
 * user/org Pages repo.
 */
export const BASE_PATH = '/bvandrc-project-template-react-frontend/'

/** Public URL of the deployed site. */
export const SITE_URL = `https://bvandrc.github.io${BASE_PATH}`
