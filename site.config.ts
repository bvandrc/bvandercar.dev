/**
 * Shared site config for the build (vite.config.ts), the test runner
 * (playwright.config.ts), and CI.
 */

/**
 * Path the site is served under, which every asset URL is prefixed with.
 *
 * The site is served from the root of its own domain. Change this, and the
 * `base-path` input of `.github/actions/build-and-serve`, if it ever moves
 * under a subpath.
 */
export const BASE_PATH = '/'

/** Public URL of the deployed site. */
export const SITE_URL = `https://bvandercar.dev${BASE_PATH}`
