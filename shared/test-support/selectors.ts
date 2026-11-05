export const SELECTORS = {
  HEADER: {
    SELF: 'header',
    LOGO: 'header-logo',
    TITLE: 'header-title',
    TAGLINE: 'header-tagline',
    STATUS: 'header-status',
  },
  MAIN: 'main',
  PROJECTS: {
    SELF: 'projects',
    CARD: {
      SELF: 'project-card',
      NAME: 'project-card-name',
      REPO_LINK: 'project-card-repo-link',
      SCREENSHOT: 'project-card-screenshot',
    },
  },
  SKILLS: {
    SELF: 'skills',
    CHIP: 'skill-chip',
  },
  BEYOND_CODE: 'beyond-code',
  FOOTER: {
    SELF: 'footer',
    GITHUB_LINK: 'footer-github-link',
  },
} as const
