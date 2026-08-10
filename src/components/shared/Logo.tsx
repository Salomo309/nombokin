import React from "react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  hideText?: boolean;
}

export function Logo({ className, iconClassName, textClassName, hideText = false }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm",
          iconClassName
        )}
      >
        {/* Document Monogram with a Checkmark SVG */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5.5 w-5.5"
        >
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <polyline points="9 15 11 17 15 13" strokeWidth="3" className="text-primary-foreground stroke-primary-foreground" />
        </svg>
      </div>
      {!hideText && (
        <span
          className={cn(
            "font-serif text-xl font-bold tracking-tight text-foreground",
            textClassName
          )}
        >
          Nombokin<span className="text-primary font-sans font-black">.</span>
        </span>
      )}
    </div>
  );
}
