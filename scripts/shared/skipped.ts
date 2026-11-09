import { getErrorMessage } from './errors.ts'

// Set by the production deploy, so the live site never shows a count that
// fell back to the profile's.
const isRequired = process.env.REQUIRE_FETCHED_DATA === 'true'

/**
 * Reports that `what` couldn't be fetched, so the profile's counts stand in
 * for it, rather than failing the build over a stats outage.
 *
 * With `REQUIRE_FETCHED_DATA=true`, it's an error instead, which fails the
 * script once it has reported everything else it couldn't fetch.
 */
export const reportSkipped = (what: string, reason: unknown) => {
  const message = `${what} could not be fetched: ${getErrorMessage(reason)}`
  if (isRequired) {
    console.error(`::error::${message}`)
    process.exitCode = 1
  } else {
    console.warn(`::warning::${message}. The profile's counts stand in.`)
  }
}
