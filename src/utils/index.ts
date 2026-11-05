/**
 * @fileoverview Small shared helpers.
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Joins conditional classes, with later Tailwind utilities winning conflicts. */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

/** `pluralize(2, 'feature')` -> `'2 features'`. */
export const pluralize = (
  count: number,
  singular: string,
  plural = `${singular}s`
) => `${count} ${count === 1 ? singular : plural}`
