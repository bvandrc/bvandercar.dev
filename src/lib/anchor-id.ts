import { kebabCase } from 'es-toolkit'

/** A section's or project card's id, from its title, for a `#` link straight to it. */
export const getAnchorId = (title: string) => kebabCase(title)
