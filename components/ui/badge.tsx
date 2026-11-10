import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-3 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-danger/30 bg-danger/10 text-danger dark:bg-danger/20 dark:text-danger-foreground",
        outline: "text-foreground border-border",
        success:
          "border-success/30 bg-success/10 text-success dark:bg-success/20 dark:text-emerald-300 font-bold shadow-sm",
        danger:
          "border-danger/30 bg-danger/10 text-danger dark:bg-danger/20 dark:text-rose-300 font-bold shadow-sm",
        beige:
          "border-warm-300/60 bg-warm-100 text-warm-800 dark:border-warm-700/50 dark:bg-warm-900/40 dark:text-warm-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

