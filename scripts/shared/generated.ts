import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { isPlainObject } from 'es-toolkit'

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

/** A constant a generated file exports. */
export type GeneratedConst = {
  name: string
  /** Its doc comment */
  doc: string
  /** Its TypeScript type, whose names the file's imports give */
  type: string
  value: unknown
}

/** `value` as a TypeScript literal: an object a key to a line, and anything else, like a day-by-day array, on one. */
const toLiteral = (value: unknown, indent = ''): string => {
  if (!isPlainObject(value)) {
    return JSON.stringify(value)
  }
  const inner = `${indent}  `
  const entries = Object.entries(value).map(
    ([key, entry]) =>
      `${inner}${JSON.stringify(key)}: ${toLiteral(entry, inner)},`
  )
  return entries.length > 0 ? `{\n${entries.join('\n')}\n${indent}}` : '{}'
}

/**
 * Writes `file`: a header naming the `pnpm` script that writes it, `imports`,
 * then each of `consts`, exported with its doc comment and type.
 */
export const writeGenerated = async (
  file: string,
  script: string,
  imports: string,
  consts: GeneratedConst[]
) => {
  await mkdir(GENERATED_DIR, { recursive: true })
  const body = consts
    .map(
      ({ name, doc, type, value }) =>
        `/** ${doc} */\nexport const ${name}: ${type} = ${toLiteral(value)}\n`
    )
    .join('\n')
  await writeFile(
    file,
    `// GENERATED FILE — do not edit directly. Run \`pnpm ${script}\`.\n\n${imports}\n\n${body}`
  )
}
