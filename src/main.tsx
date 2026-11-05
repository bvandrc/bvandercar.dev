import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ReactGA from 'react-ga4'

import { App } from './App'

const GA_MEASUREMENT_ID = 'G-VLY3Q6RV4M'
const PRODUCTION_HOSTNAME = 'bvandercar.dev'

// Only the live site reports, so local runs and CI's test and Lighthouse runs
// against the preview server don't count as visits.
if (window.location.hostname === PRODUCTION_HOSTNAME) {
  ReactGA.initialize(GA_MEASUREMENT_ID)
}

// biome-ignore lint/style/noNonNullAssertion: root is always present
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
