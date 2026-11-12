import { Octokit } from 'octokit'

// Actions sets this, to GitHub Enterprise's API on an Enterprise server.
const API_URL = process.env.GITHUB_API_URL || 'https://api.github.com'

/** The token the fetches read GitHub with, if set; Actions passes an unset secret as an empty string. */
export const token = process.env.GITHUB_TOKEN || undefined

// How many times a rate-limited request is retried, after waiting as long as
// GitHub asks, before what it was for is left out.
const MAX_RATE_LIMIT_RETRIES = 2

/** Whether to retry a rate-limited request, as Octokit's throttling asks. */
const shouldRetryRateLimit = (
  _retryAfter: number,
  _options: unknown,
  _octokit: unknown,
  retryCount: number
) => retryCount < MAX_RATE_LIMIT_RETRIES

/**
 * A GitHub API client, with `token` where it's set.
 *
 * Octokit follows each list's pages, retries a request GitHub fails briefly,
 * and waits out a rate limit twice before giving up on it.
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
