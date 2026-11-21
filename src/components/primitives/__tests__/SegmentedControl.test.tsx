import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import {
  SegmentedControl,
  type SegmentedControlOption,
} from '../SegmentedControl'

const SELF = 'segmented-control'
const OPTION = 'segmented-control-option'

const OPTIONS = [
  { value: 'day', label: 'Day', 'data-testid': OPTION },
  { value: 'week', label: 'Week', 'data-testid': OPTION },
] satisfies SegmentedControlOption<'day' | 'week'>[]

/** Renders the control over `OPTIONS`, with `value` chosen, reporting a change to `onChange`. */
const renderControl = (
  value: 'day' | 'week' | undefined,
  onChange: (value: 'day' | 'week') => void = vi.fn(),
  focusable?: boolean
) =>
  render(
    <SegmentedControl
      options={OPTIONS}
      value={value}
      onChange={onChange}
      focusable={focusable}
    />
  )

/** Each option's label, and whether it's chosen. */
const getOptions = () =>
  screen
    .getAllByTestId(OPTION)
    .map((option) => [option.textContent, option.getAttribute('aria-checked')])

describe('SegmentedControl', () => {
  it('shows its options in order, the chosen one checked, or none for no value', () => {
    const { unmount } = renderControl('week')
    expect(getOptions()).toEqual([
      ['Day', 'false'],
      ['Week', 'true'],
    ])
    unmount()

    renderControl(undefined)
    expect(getOptions().map(([, checked]) => checked)).toEqual([
      'false',
      'false',
    ])
  })

  it('reports a click on another option, but not one on the chosen one, which stays chosen', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    renderControl('day', onChange)
    const [day, week] = screen.getAllByTestId(OPTION)

    await user.click(day)
    expect(onChange).not.toHaveBeenCalled()
    await user.click(week)
    expect(onChange).toHaveBeenCalledExactlyOnceWith('week')
  })

  it('passes its other props to the group around its options', () => {
    render(
      <SegmentedControl
        options={OPTIONS}
        value="day"
        onChange={vi.fn()}
        aria-hidden
        data-testid={SELF}
      />
    )

    expect(screen.getByTestId(SELF).getAttribute('aria-hidden')).toBe('true')
  })

  it('leaves its options out of the tab order where it is not focusable', () => {
    renderControl('day', undefined, false)

    for (const option of screen.getAllByTestId(OPTION)) {
      expect(option.tabIndex, option.textContent ?? '').toBe(-1)
    }
  })
})
