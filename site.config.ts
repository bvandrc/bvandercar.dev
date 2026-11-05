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

// Google Analytics (react-ga4) loads gtag.js and sends hits to these origins.
const GA_SCRIPT_ORIGINS = 'https://*.googletagmanager.com'
const GA_HIT_ORIGINS =
  'https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com'

// Devicon's logos, for the few Simple Icons lacks.
const DEVICON_ORIGIN = 'https://cdn.jsdelivr.net'

// The project sites shown live in an iframe: each project with an `embed` in
// the profile content. __tests__/site.config.test.ts checks none is missing.
const EMBED_ORIGINS = [
  'https://taskrankr.com',
  'https://bvandrc.github.io',
  'https://specialingredientbass.com',
].join(' ')

// Cloudflare Web Analytics, which Cloudflare injects into every page, loads its
// beacon from the first origin and reports to the second.
const CLOUDFLARE_BEACON_ORIGIN = 'https://static.cloudflareinsights.com'
const CLOUDFLARE_REPORT_ORIGIN = 'https://cloudflareinsights.com'

const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src 'self' ${GA_SCRIPT_ORIGINS} ${CLOUDFLARE_BEACON_ORIGIN}`,
  `connect-src 'self' ${GA_HIT_ORIGINS} ${CLOUDFLARE_REPORT_ORIGIN}`,
  `img-src 'self' data: ${GA_HIT_ORIGINS} ${DEVICON_ORIGIN}`,
  "style-src 'self'",
  `frame-src ${EMBED_ORIGINS}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

/**
 * Security headers sent with every response.
 *
 * The build writes them to `dist/_headers` for Cloudflare, and `vite preview`
 * sends them too, so CI's ZAP scan sees what production serves.
 */
export const SECURITY_HEADERS = {
  'Content-Security-Policy': CONTENT_SECURITY_POLICY,
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
} as const satisfies Record<string, string>
