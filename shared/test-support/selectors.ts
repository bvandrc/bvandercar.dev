export const SELECTORS = {
  HEADER: {
    SELF: 'header',
    LOGO: 'header-logo',
    TITLE: 'header-title',
    TAGLINE: 'header-tagline',
  },
  FEATURE_LIST: {
    SELF: 'feature-list',
    CARD: {
      SELF: 'feature-card',
      NAME: 'feature-card-name',
      STATUS: 'feature-card-status',
      DESCRIPTION: 'feature-card-description',
    },
    exampleTestIdGetter: (itemId: string) => `feature-card-${itemId}` as const,
  },
  FOOTER: 'footer',
} as const
