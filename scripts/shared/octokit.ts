import { Octokit } from 'octokit'

// Actions sets this, to GitHub Enterprise's API on an Enterprise server.
const API_URL = process.env.GITHUB_API_URL || 'https://api.github.com'

/** The token the fetches read GitHub with, if set; Actions passes an unset secret as an empty string. */
export const token = process.env.GITHUB_TOKEN || undefined

// How many times a rate-limited request is retried, after waiting as long as
// GitHub asks, before what it was for is left out: more where the wait is
// short, as search's, which resets each minute, so builds searching with the
// same token at once take turns rather than fail.
const MAX_RATE_LIMIT_RETRIES = 2
const MAX_SHORT_WAIT_RETRIES = 8
// The longest wait, in seconds, that counts as short.
const SHORT_WAIT_SECONDS = 90

/** Whether to retry a rate-limited request, after `retryAfter` seconds, as Octokit's throttling asks. */
const shouldRetryRateLimit = (
  retryAfter: number,
  _options: unknown,
  _octokit: unknown,
  retryCount: number
) =>
  retryCount <
  (retryAfter <= SHORT_WAIT_SECONDS
    ? MAX_SHORT_WAIT_RETRIES
    : MAX_RATE_LIMIT_RETRIES)

/**
 * A GitHub API client, with `token` where it's set.
 *
 * Octokit follows each list's pages, retries a request GitHub fails briefly,
 * and waits out a rate limit before giving up on it: eight times for a wait
 * under a minute and a half, as search's, or twice for a longer one.
 */
export const octokit = new Octokit({
  auth: token,
  baseUrl: API_URL,
  userAgent: 'bvandercar.dev',
  throttle: {
    onRateLimit: shouldRetryRateLimit,
    onSecondaryRateLimit: shouldRetryRateLimit,
  },
})
