/**
 * Fetches the profile content from the bvandrc/bvandrc repo, the same source
 * its GitHub README is built from.
 *
 * Writes the content modules to src/generated/profile/ and the screenshots
 * they reference to public/, both gitignored. Set PROFILE_REF to read a
 * branch or commit other than main.
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

const REF = process.env.PROFILE_REF || 'main'
const RAW_BASE = `https://raw.githubusercontent.com/bvandrc/bvandrc/${REF}`
const OUT_DIR = 'src/generated/profile'

// Repo path → path under OUT_DIR. The content files import each other
// relatively, so they keep their folder.
const MODULES = {
  'src/content/types.ts': 'content/types.ts',
  'src/content/about.ts': 'content/about.ts',
  'src/content/projects.ts': 'content/projects.ts',
  'src/content/skills.ts': 'content/skills.ts',
  'src/generated/repo-counts.ts': 'repo-counts.ts',
}

const download = async (repoPath) => {
  const response = await fetch(`${RAW_BASE}/${repoPath}`)
  if (!response.ok) {
    throw new Error(`${repoPath}@${REF}: HTTP ${response.status}`)
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
  `profile: ${Object.keys(MODULES).length} modules and ${screenshots.length} screenshots from bvandrc@${REF}`
)
