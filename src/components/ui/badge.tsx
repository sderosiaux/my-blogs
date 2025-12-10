import { HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-foreground text-background',
        secondary: 'border-transparent bg-muted text-muted-foreground',
        outline: 'text-foreground',
        idea: 'border-transparent bg-status-idea/10 text-status-idea',
        draft: 'border-transparent bg-status-draft/10 text-status-draft',
        ready: 'border-transparent bg-status-ready/10 text-status-ready',
        scheduled: 'border-transparent bg-status-scheduled/10 text-status-scheduled',
        published: 'border-transparent bg-status-published/10 text-status-published',
        archived: 'border-transparent bg-status-archived/10 text-status-archived',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
