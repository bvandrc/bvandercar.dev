import { type RenderOptions, render } from '@testing-library/react'

import { TooltipProvider } from '@/components/primitives/Tooltip'

/** Renders `ui` inside the providers `App` mounts at the root, which some components can't render without. */
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: TooltipProvider, ...options })
