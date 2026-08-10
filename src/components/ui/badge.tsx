import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow",
        outline: "text-foreground border border-border",
        // status specific tonal styles
        success: "border-transparent bg-[#ECFDF3] text-[#15803D]",
        warning: "border-transparent bg-amber-50 text-[#B45309]",
        info: "border-transparent bg-blue-50 text-blue-700",
        stone: "border-transparent bg-stone-100 text-stone-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  showDot?: boolean;
  dotColorClass?: string;
}

function Badge({ className, variant, showDot, dotColorClass, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {showDot && (
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            dotColorClass || "bg-current"
          )}
        />
      )}
      {props.children}
    </div>
  );
}

export { Badge, badgeVariants };
