import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export interface SpinnerProps {
  className?: string;
  label?: string;
  size?: "sm" | "default" | "lg";
}

const sizes = {
  sm: "size-4",
  default: "size-6",
  lg: "size-8",
};

export function Spinner({
  className,
  label = "Loading",
  size = "default",
}: SpinnerProps) {
  return (
    <span role="status" className="inline-flex items-center gap-2">
      <Loader2
        className={cn("animate-spin text-primary", sizes[size], className)}
        aria-hidden
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
