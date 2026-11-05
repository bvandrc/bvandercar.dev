/** Devicon's logo for a slug, in the brand's own colors, from jsDelivr. */
export const deviconUrl = (slug: string) =>
  // Pinned, since jsDelivr serves the package as published.
  `https://cdn.jsdelivr.net/npm/devicon@2.18.0/icons/${slug}/${slug}-original.svg`
