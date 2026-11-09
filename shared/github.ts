/** The GitHub account the profile content and every project repo are under. */
export const GITHUB_OWNER = 'bvandrc'

/** The owner's GitHub profile. */
export const GITHUB_PROFILE_URL = `https://github.com/${GITHUB_OWNER}`

/** The GitHub page of the owner's repo named `repo`, which also clones it. */
export const getRepoUrl = (repo: string) => `${GITHUB_PROFILE_URL}/${repo}`
