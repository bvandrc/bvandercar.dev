import { cn } from '@/utils'

export const Card = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('rounded-xl border border-border bg-surface p-5', className)}
    {...props}
  />
)
