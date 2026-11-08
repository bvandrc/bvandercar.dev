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
    REPO_LINK_LABEL: 'project-repo-link-label',
    COUNTS: 'project-counts',
    CHARTS_LOADING: 'project-charts-loading',
    ACTIVITY_CHART: 'activity-chart',
    DOWNLOADS_CHART: 'downloads-chart',
    RUNNING_TOTAL_CHART: {
      PLOT: 'running-total-chart-plot',
      READOUT: 'running-total-chart-readout',
      TOTAL: 'running-total-chart-total',
      DOT: 'running-total-chart-dot',
      RELEASE: 'running-total-chart-release',
      LINE: 'running-total-chart-line',
    },
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
