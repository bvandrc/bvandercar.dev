import { kebabCase } from 'es-toolkit'

/** A section's id, from its title, for a `#` link straight to it. */
export const sectionAnchor = (title: string) => kebabCase(title)
