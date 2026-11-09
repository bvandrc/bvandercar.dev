export type ListProps = Omit<
  React.ComponentProps<'ul'>,
  'role' | 'children'
> & {
  children: React.ReactNode
}

/** A `ul` that keeps its list semantics once Tailwind removes its bullets. */
export const List = ({ children, ...props }: ListProps) => (
  // biome-ignore lint/a11y/noRedundantRoles: Safari drops list semantics once Tailwind removes the bullets.
  <ul role="list" {...props}>
    {children}
  </ul>
)
