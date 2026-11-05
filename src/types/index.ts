/**
 * @fileoverview Types shared across the app.
 */

import type { FeatureStatus } from '@/constants'

export interface Feature {
  name: string
  description: string
  status: FeatureStatus
}
