/**
 * Fetches the profile content from the bvandrc/bvandrc repo, the same source
 * its GitHub README is built from.
 *
 * Copies its src/content/ and src/generated/repo-counts.ts to
 * src/generated/profile/, and the screenshots the projects reference to
 * public/, all gitignored. Reads bvandrc's PROFILE_DEV_BRANCH while it exists,
 * else main; PROFILE_REF, if set, reads that branch or commit instead.
 */

import { execFileSync } from 'node:child_process'
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const REPO_URL = 'https://github.com/bvandrc/bvandrc'
// The bvandrc branch this site's content is developed on, so a change there
// reaches every build here without merging to bvandrc's main first. Once it's
// merged and deleted, builds read main.
const PROFILE_DEV_BRANCH = 'feat/bvandercar-dev-content'
const OUT_DIR = 'src/generated/profile'

const git = (...args: string[]) =>
  execFileSync('git', ['-C', checkout, ...args], { encoding: 'utf8' }).trim()

// A shallow, sparse checkout of just the paths the site reads: the whole
// content folder, so files can come and go there without a change here.
// Git fetches the ref itself, which also never returns a stale branch the
// way raw.githubusercontent.com's cache can.
const checkout = await mkdtemp(join(tmpdir(), 'bvandrc-'))
try {
  git('init', '-q')
  git('remote', 'add', 'origin', REPO_URL)
  // An explicit PROFILE_REF is read as given, so a typo fails rather than
  // quietly falling back to main.
  const ref =
    process.env.PROFILE_REF ||
    (git('ls-remote', '--heads', 'origin', PROFILE_DEV_BRANCH)
      ? PROFILE_DEV_BRANCH
      : 'main')
  git(
    'sparse-checkout',
    'set',
    '--no-cone',
    '/src/content/',
    '/src/generated/repo-counts.ts',
    '/project-screenshots/'
  )
  git('fetch', '-q', '--depth', '1', '--filter=blob:none', 'origin', ref)
  git('checkout', '-q', 'FETCH_HEAD')
  const commit = git('rev-parse', '--short', 'HEAD')

  // Cleared first, so a module bvandrc removed doesn't linger here.
  await rm(OUT_DIR, { recursive: true, force: true })
  await cp(join(checkout, 'src/content'), join(OUT_DIR, 'content'), {
    recursive: true,
  })
  await cp(
    join(checkout, 'src/generated/repo-counts.ts'),
    join(OUT_DIR, 'repo-counts.ts')
  )

  // Screenshot paths are repo-relative ('./project-screenshots/…'), which is
  // also where public/ serves them from.
  const projects = await readFile(
    join(checkout, 'src/content/projects.ts'),
    'utf8'
  )
  const screenshots = [
    ...projects.matchAll(/screenshot:\s*'\.\/([^']+)'/g),
  ].map(([, path]) => path)
  await Promise.all(
    screenshots.map((path) => cp(join(checkout, path), join('public', path)))
  )

  console.log(
    `profile: src/content and ${screenshots.length} screenshots from bvandrc@${ref} (${commit})`
  )
} finally {
  await rm(checkout, { recursive: true, force: true })
}
