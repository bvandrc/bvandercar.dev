/** Where the build's fetched data goes, gitignored, for the app to import. */
export const GENERATED_DIR = 'src/generated'

/** Where `pnpm fetch:profile` copies the profile's content and counts. */
export const PROFILE_DIR = `${GENERATED_DIR}/profile`

/** The projects `pnpm fetch:profile` copied, which the other fetches read their repos and packages from. */
export const PROJECTS_FILE = `${PROFILE_DIR}/content/projects.ts`

export const DAY_MS = 24 * 60 * 60 * 1000
