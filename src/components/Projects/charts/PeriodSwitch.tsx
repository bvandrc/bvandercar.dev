import { objectEntries } from 'ts-extras'

import { SegmentedControl } from '@/components/primitives/SegmentedControl'
import type { ChartPeriod } from '~/counts'

// What each period's option says, in the order they sit.
const PERIOD_LABELS = {
  ALL: 'All time',
  LAST_90_DAYS: 'Last 90 days',
  LAST_30_DAYS: 'Last 30 days',
} as const satisfies Record<ChartPeriod, string>

const PERIOD_OPTIONS = objectEntries(PERIOD_LABELS).map(([value, label]) => ({
  value,
  label,
  'data-testid': 'chart-period-option',
}))

export type PeriodSwitchProps = {
  /** The period chosen, or undefined for none, as where the charts open on a span of their own */
  period: ChartPeriod | undefined
  /** Called with the period whose option is clicked */
  onChange: (period: ChartPeriod) => void
}

/**
 * Options that switch the charts between all time and the last 90 or 30
 * days, longest first, the chosen one standing out.
 *
 * For sighted pointer users only, like the charts it switches.
 */
export const PeriodSwitch = ({ period, onChange }: PeriodSwitchProps) => (
  <SegmentedControl
    options={PERIOD_OPTIONS}
    value={period}
    onChange={onChange}
    // Out of the tab order and hidden from screen readers, like the charts.
    focusable={false}
    aria-hidden
    data-testid="chart-period"
  />
)
