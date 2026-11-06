import { cn } from '@/utils'

export type BadgeTone = 'positive' | 'neutral'

const TONE_CLASSES = {
  positive: 'text-tone-positive',
  neutral: 'text-tone-neutral',
} satisfies Record<BadgeTone, string>

export const Badge = ({
  tone = 'neutral',
  className,
  children,
  ...props
}: {
  tone?: BadgeTone
  children: React.ReactNode
} & React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    className={cn(
      'rounded-full border border-current px-2 py-0.5 text-xs font-medium whitespace-nowrap',
      TONE_CLASSES[tone],
      className
    )}
    {...props}>
    {children}
  </span>
)
