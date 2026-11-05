import { cn } from '@/utils'

type ButtonVariant = 'solid' | 'outline'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const VARIANT_CLASSES = {
  solid: 'bg-accent text-accent-ink hover:bg-accent-hover',
  outline:
    'border border-border text-ink hover:border-accent hover:text-accent',
} satisfies Record<ButtonVariant, string>

export const Button = ({
  variant = 'solid',
  className,
  type = 'button',
  ...props
}: ButtonProps) => (
  <button
    type={type}
    className={cn(
      'rounded-full px-4 py-1.5 text-sm font-medium transition-colors disabled:opacity-50',
      VARIANT_CLASSES[variant],
      className
    )}
    {...props}
  />
)
