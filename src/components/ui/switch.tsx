"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, ...props }, ref) => {
    return (
      <label className="inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          role="switch"
          ref={ref}
          className="peer sr-only"
          {...props}
        />
        <span
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full bg-input transition-colors peer-checked:bg-primary peer-focus-visible:ring-3 peer-focus-visible:ring-ring/30 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-background after:shadow-sm after:transition-transform peer-checked:after:translate-x-5",
            className,
          )}
          aria-hidden
        />
      </label>
    );
  },
);
Switch.displayName = "Switch";

export { Switch };
