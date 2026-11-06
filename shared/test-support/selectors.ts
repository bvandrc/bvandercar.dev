export const SELECTORS = {
  HEADER: {
    SELF: 'header',
    LOGO: 'header-logo',
    TITLE: 'header-title',
    TAGLINE: 'header-tagline',
  },
  MAIN: 'main',
  PROJECTS: {
    SELF: 'projects',
    CARD: 'project-card',
    REPO_LINK: 'project-repo-link',
    COUNTS: 'project-counts',
  },
  SKILLS: {
    SELF: 'skills',
  },
  BEYOND_CODE: 'beyond-code',
  LIVE_PREVIEW: {
    SELF: 'live-preview',
    TOGGLE: 'live-preview-toggle',
    FRAME: 'live-preview-frame',
  },
  TOOLTIP: 'tooltip',
} as const
