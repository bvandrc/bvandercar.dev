import { objectEntries } from 'ts-extras'

import { SegmentedControl } from '@/components/primitives/SegmentedControl'
import type { ChartPeriod } from '~/counts'

// What each period's option says, in the order they sit.
const PERIOD_LABELS = {
  ALL: 'All time',
  LAST_YEAR: '1 year',
  LAST_90_DAYS: '90 days',
  LAST_30_DAYS: '30 days',
} as const satisfies Record<ChartPeriod, string>

const PERIOD_OPTIONS = objectEntries(PERIOD_LABELS).map(([value, label]) => ({
  value,
  label,
  'data-testid': 'chart-period-option',
}))

export type PeriodSwitchProps = {
  /** The periods it offers, which sit in the same order whichever they are */
  periods: ChartPeriod[]
  /** The period chosen */
  period: ChartPeriod
  /** Called with the period whose option is clicked */
  onChange: (period: ChartPeriod) => void
}

/**
 * Options that switch the charts between all time and the last year, 90
 * days, or 30 days, longest first, the chosen one standing out.
 *
 * For sighted pointer users only, like the charts it switches.
 */
export const PeriodSwitch = ({
  periods,
  period,
  onChange,
}: PeriodSwitchProps) => (
  <SegmentedControl
    options={PERIOD_OPTIONS.filter(({ value }) => periods.includes(value))}
    value={period}
    onChange={onChange}
    // Out of the tab order and hidden from screen readers, like the charts.
    focusable={false}
    aria-hidden
    data-testid="chart-period"
  />
)
