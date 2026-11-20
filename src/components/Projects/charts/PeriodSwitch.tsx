import { objectKeys } from 'ts-extras'

import { cn } from '@/lib/cn'
import type { ChartPeriod } from '~/counts'

// What each period's button says, in the order they sit.
const PERIOD_LABELS = {
  ALL: 'All time',
  LAST_90_DAYS: 'Last 90 days',
  LAST_30_DAYS: 'Last 30 days',
} as const satisfies Record<ChartPeriod, string>

// The chosen period's button stands out from the others.
const PERIOD_BUTTON_CLASSES = {
  CHOSEN: 'bg-ink-muted/20 text-ink',
  IDLE: 'text-ink-muted hover:text-ink',
} as const

export type PeriodSwitchProps = {
  /** The period chosen, or undefined for none, as where the charts open on a span of their own */
  period: ChartPeriod | undefined
  /** Called with the period whose button is clicked */
  onChange: (period: ChartPeriod) => void
}

/**
 * Buttons that switch the charts between all time and the last 90 or 30
 * days, longest first, the chosen one standing out.
 *
 * For sighted pointer users only, like the charts it switches.
 */
export const PeriodSwitch = ({ period, onChange }: PeriodSwitchProps) => (
  <div aria-hidden className="flex gap-1 text-xs">
    {objectKeys(PERIOD_LABELS).map((key) => (
      <button
        key={key}
        type="button"
        // Out of the tab order, like the charts, which only sighted pointer
        // users see.
        tabIndex={-1}
        aria-pressed={key === period}
        onClick={() => onChange(key)}
        className={cn(
          'rounded-md px-2 py-0.5',
          PERIOD_BUTTON_CLASSES[key === period ? 'CHOSEN' : 'IDLE']
        )}
        data-testid="chart-period">
        {PERIOD_LABELS[key]}
      </button>
    ))}
  </div>
)
