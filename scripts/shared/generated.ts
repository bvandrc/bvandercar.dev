import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'

import { GENERATED_DIR } from './constants.ts'

/**
 * Ends the script where `REUSE_FETCHED_DATA=true` and every one of `files`
 * is already there, as a preview build sets with recent data it restored
 * from its cache.
 */
export const exitIfReusing = (label: string, files: string[]) => {
  if (
    process.env.REUSE_FETCHED_DATA === 'true' &&
    files.every((file) => existsSync(file))
  ) {
    console.log(`${label}: reusing ${files.join(' and ')}`)
    process.exit(0)
  }
}

/** Writes `body` to `file`, under a header naming the `pnpm` script that writes it. */
export const writeGenerated = async (
  file: string,
  script: string,
  body: string
) => {
  await mkdir(GENERATED_DIR, { recursive: true })
  await writeFile(
    file,
    `// GENERATED FILE — do not edit directly. Run \`pnpm ${script}\`.\n\n${body}`
  )
}
