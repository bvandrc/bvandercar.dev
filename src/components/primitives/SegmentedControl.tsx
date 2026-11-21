import { ToggleGroup } from 'radix-ui'

import { cn } from '@/lib/cn'

/** One of a segmented control's options: its value, and what it says. */
export type SegmentedControlOption<T extends string> = {
  value: T
  label: React.ReactNode
  'data-testid'?: string
}

export type SegmentedControlProps<T extends string> = Omit<
  ToggleGroup.ToggleGroupSingleProps,
  // What it sets itself from the props below, and the div's own onChange,
  // which its own replaces.
  | 'type'
  | 'value'
  | 'defaultValue'
  | 'onValueChange'
  | 'onChange'
  | 'rovingFocus'
  | 'children'
> & {
  options: readonly SegmentedControlOption<T>[]
  /** The option chosen, or undefined for none */
  value: T | undefined
  /** Called with the option clicked, unless it's the one already chosen */
  onChange: (value: T) => void
  /**
   * Whether a keyboard reaches its options, which it does unless set false,
   * as for one only pointer users see, like the charts'.
   */
  focusable?: boolean
  'data-testid'?: string
}

/**
 * A row of options, one of which is chosen, standing out from the rest, like
 * a time range above a chart.
 *
 * A screen reader hears a radio group. Clicking the chosen option leaves it
 * chosen, so one always is once picked.
 */
export const SegmentedControl = <T extends string>({
  options,
  value,
  onChange,
  focusable = true,
  className,
  ...props
}: SegmentedControlProps<T>) => (
  <ToggleGroup.Root
    {...props}
    type="single"
    // Radix's value is a string, with none as an empty one.
    value={value ?? ''}
    onValueChange={(next) => {
      // Radix clears it on a click of the chosen option, which keeps it here.
      const option = options.find((candidate) => candidate.value === next)
      if (option) {
        onChange(option.value)
      }
    }}
    rovingFocus={focusable}
    className={cn('flex gap-1 text-xs', className)}>
    {options.map((option) => (
      <ToggleGroup.Item
        key={option.value}
        value={option.value}
        tabIndex={focusable ? undefined : -1}
        className={cn(
          'rounded-md px-2 py-0.5 text-ink-muted hover:text-ink',
          // The chosen one stands out from the others.
          'data-[state=on]:bg-ink-muted/20 data-[state=on]:text-ink'
        )}
        data-testid={option['data-testid']}>
        {option.label}
      </ToggleGroup.Item>
    ))}
  </ToggleGroup.Root>
)
