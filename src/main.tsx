import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './App'

const GA_MEASUREMENT_ID = 'G-VLY3Q6RV4M'
const PRODUCTION_HOSTNAME = 'bvandercar.dev'

// Only the live site reports, so local runs and CI's test and Lighthouse runs
// against the preview server don't count as visits.
if (window.location.hostname === PRODUCTION_HOSTNAME) {
  // Once the page has loaded, so Google's tag, which react-ga4 loads, doesn't
  // compete with the page's own script for the network and main thread.
  window.addEventListener(
    'load',
    async () => {
      const { default: ReactGA } = await import('react-ga4')
      ReactGA.initialize(GA_MEASUREMENT_ID)
    },
    { once: true }
  )
}

// biome-ignore lint/style/noNonNullAssertion: root is always present
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
