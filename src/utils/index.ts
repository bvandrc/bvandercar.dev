/**
 * @fileoverview Small shared helpers.
 */

import { type ClassValue, clsx } from 'clsx'
import { extendTailwindMerge, validators } from 'tailwind-merge'

// The `shadow-glow-*` utility from src/styles/index.css gets its own group.
// Otherwise tailwind-merge reads it as a shadow color and drops it, or the
// real `shadow-<color>` beside it.
const twMerge = extendTailwindMerge<'shadow-glow'>({
  extend: {
    classGroups: {
      'shadow-glow': [{ 'shadow-glow': [validators.isNumber] }],
    },
  },
})

/** Joins conditional classes, with later Tailwind utilities winning conflicts. */
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
