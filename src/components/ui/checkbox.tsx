"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  indeterminate?: boolean;
  className?: string;
  "aria-label"?: string;
}

export function Checkbox({
  checked,
  onCheckedChange,
  indeterminate,
  className,
  ...props
}: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className={cn(
        "h-4 w-4 shrink-0 cursor-pointer rounded border-border accent-primary",
        className
      )}
      {...props}
    />
  );
}
