import { getErrorMessage } from './errors.ts'

// Set by the production deploy, so the live site never shows a count that
// fell back to the profile's.
const isRequired = process.env.REQUIRE_FETCHED_DATA === 'true'

/**
 * Reports that `what` was left out, for `reason`, like a failed fetch, so the
 * profile's counts stand in for it, rather than failing the build over a
 * stats outage.
 *
 * With `REQUIRE_FETCHED_DATA=true`, it's an error instead, which fails the
 * script once it has reported everything else it left out.
 */
export const reportSkipped = (what: string, reason: unknown) => {
  const message = `Left out ${what}: ${getErrorMessage(reason)}`
  if (isRequired) {
    console.error(`::error::${message}`)
    process.exitCode = 1
  } else {
    console.warn(`::warning::${message}. The profile's counts stand in.`)
  }
}
