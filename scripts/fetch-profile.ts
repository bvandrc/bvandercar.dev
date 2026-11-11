/**
 * Fetches the profile content from the bvandrc/bvandrc repo, the same source
 * its GitHub README is built from.
 *
 * Copies its src/content/ and src/generated/repo-counts.ts to
 * src/generated/profile/, and the screenshots the projects reference to
 * public/, each with WebP thumbnails, and a live preview's with posters, beside
 * it, all gitignored. Reads bvandrc's PROFILE_DEV_BRANCH while it exists,
 * else main; PROFILE_REF, if set, reads that branch or commit instead.
 */

import { execFileSync } from 'node:child_process'
import { cp, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import sharp from 'sharp'

import { GITHUB_OWNER, getRepoUrl } from '../shared/github.ts'
import {
  DEFAULT_POSTER_HEIGHT,
  getPosterPath,
  getThumbnailPath,
  POSTER_MIN_WIDTH,
  THUMBNAIL_WIDTHS,
} from '../shared/screenshots.ts'
import { PROFILE_DIR } from './shared/constants.ts'

// A GitHub profile's README comes from the repo named after its owner.
const REPO_URL = getRepoUrl(GITHUB_OWNER)
// The bvandrc branch this site's content is developed on, so a change there
// reaches every build here without merging to bvandrc's main first. Once it's
// merged and deleted, builds read main.
const PROFILE_DEV_BRANCH = 'feat/bvandercar-dev-content'

/**
 * Writes a live preview's poster of the screenshot at `source`: only the top
 * a phone shows across its toggle, `posterHeight` px tall at its narrowest.
 */
const writePosters = async (
  source: string,
  screenshot: string,
  posterHeight = DEFAULT_POSTER_HEIGHT
) => {
  const { width, height } = await sharp(source).metadata()
  // The narrowest toggle scales the screenshot down to its own width, so this
  // many of the screenshot's rows fill its height.
  const top = Math.min(
    height,
    Math.ceil((posterHeight * width) / POSTER_MIN_WIDTH)
  )
  await Promise.all(
    THUMBNAIL_WIDTHS.map((posterWidth) =>
      sharp(source)
        .extract({ left: 0, top: 0, width, height: top })
        .resize({ width: posterWidth, withoutEnlargement: true })
        .webp()
        .toFile(join('public', getPosterPath(screenshot, posterWidth)))
    )
  )
}

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
  await rm(PROFILE_DIR, { recursive: true, force: true })
  await cp(join(checkout, 'src/content'), join(PROFILE_DIR, 'content'), {
    recursive: true,
  })
  await cp(
    join(checkout, 'src/generated/repo-counts.ts'),
    join(PROFILE_DIR, 'repo-counts.ts')
  )

  // Read from the copy, now it's here, rather than parsed out of its source.
  const { PROJECTS } = await import(
    '../src/generated/profile/content/projects.ts'
  )
  const pictured = PROJECTS.flatMap(({ projects }) => projects).flatMap(
    ({ screenshot, embed }) => (screenshot ? [{ screenshot, embed }] : [])
  )
  await Promise.all(
    pictured.map(async ({ screenshot, embed }) => {
      // Screenshot paths are repo-relative ('./project-screenshots/…'), which
      // is also where public/ serves them from.
      const source = join(checkout, screenshot)
      await cp(source, join('public', screenshot))
      // A card shows its screenshot as WebP, at the width it needs, where
      // the PNG would be several times the bytes.
      await Promise.all(
        THUMBNAIL_WIDTHS.map((width) =>
          sharp(source)
            .resize({ width, withoutEnlargement: true })
            .webp()
            .toFile(join('public', getThumbnailPath(screenshot, width)))
        )
      )
      if (embed) {
        await writePosters(source, screenshot, embed.posterHeight)
      }
    })
  )

  console.log(
    `profile: src/content and ${pictured.length} screenshots, with thumbnails and posters, from bvandrc@${ref} (${commit})`
  )
} finally {
  await rm(checkout, { recursive: true, force: true })
}
