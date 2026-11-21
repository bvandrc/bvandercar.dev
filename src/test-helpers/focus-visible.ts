/**
 * Leaves the focus a tap or click gives an element without a focus ring, as a
 * browser does, for the rest of the test.
 *
 * happy-dom matches `:focus-visible` on any focus, as if from the keyboard,
 * so a press would act like a keyboard focus, like holding a tooltip open.
 * Every focus goes unringed once it's called, keyboard focus included.
 */
export const mockPressFocus = () => {
  const { matches } = Element.prototype
  const spy = vi
    .spyOn(Element.prototype, 'matches')
    .mockImplementation(function (this: Element, selector: string) {
      return selector !== ':focus-visible' && matches.call(this, selector)
    })
  onTestFinished(() => spy.mockRestore())
}
