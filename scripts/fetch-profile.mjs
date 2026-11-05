/**
 * Fetches the profile content from the bvandrc/bvandrc repo, the same source
 * its GitHub README is built from.
 *
 * Writes the content modules to src/generated/profile/ and the screenshots
 * they reference to public/, both gitignored. Set PROFILE_REF to read a
 * branch or commit other than main.
 */

import { execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const REPO_URL = 'https://github.com/bvandrc/bvandrc'
const REF = process.env.PROFILE_REF || 'main'

/** Resolves a branch or tag to its commit; a full commit hash passes through. */
const resolveCommit = (ref) => {
  if (/^[0-9a-f]{40}$/.test(ref)) {
    return ref
  }
  // raw.githubusercontent.com caches a branch URL for minutes after a push,
  // and its edges don't expire together, so reading by branch can return
  // old files. A commit URL never changes, so resolve the branch first.
  const output = execFileSync('git', ['ls-remote', REPO_URL, ref], {
    encoding: 'utf8',
  })
  const commit = output.match(/^([0-9a-f]{40})\s/)?.[1]
  if (!commit) {
    throw new Error(`${REPO_URL} has no ref "${ref}"`)
  }
  return commit
}

const COMMIT = resolveCommit(REF)
const RAW_BASE = `https://raw.githubusercontent.com/bvandrc/bvandrc/${COMMIT}`
const OUT_DIR = 'src/generated/profile'

// Repo path → path under OUT_DIR. The content files import each other
// relatively, so they keep their folder.
const MODULES = {
  'src/content/types.ts': 'content/types.ts',
  'src/content/about.ts': 'content/about.ts',
  'src/content/projects.ts': 'content/projects.ts',
  'src/content/skills.ts': 'content/skills.ts',
  'src/content/project-types.ts': 'content/project-types.ts',
  'src/generated/repo-counts.ts': 'repo-counts.ts',
}

const download = async (repoPath) => {
  const response = await fetch(`${RAW_BASE}/${repoPath}`)
  if (!response.ok) {
    throw new Error(`${repoPath}@${COMMIT}: HTTP ${response.status}`)
  }
  return Buffer.from(await response.arrayBuffer())
}

const save = async (path, data) => {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, data)
}

const modules = Object.fromEntries(
  await Promise.all(
    Object.entries(MODULES).map(async ([repoPath, outPath]) => {
      const data = await download(repoPath)
      await save(join(OUT_DIR, outPath), data)
      return [repoPath, data]
    })
  )
)

// Screenshot paths are repo-relative ('./project-screenshots/…'), which is
// also where public/ serves them from.
const projectsSource = modules['src/content/projects.ts'].toString()
const screenshots = [
  ...projectsSource.matchAll(/screenshot:\s*'\.\/([^']+)'/g),
].map(([, path]) => path)
await Promise.all(
  screenshots.map(async (path) =>
    save(join('public', path), await download(path))
  )
)

console.log(
  `profile: ${Object.keys(MODULES).length} modules and ${screenshots.length} screenshots from bvandrc@${REF} (${COMMIT.slice(0, 7)})`
)
