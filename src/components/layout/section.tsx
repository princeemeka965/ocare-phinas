import * as React from "react";

import { cn } from "@/lib/utils";

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  as?: "section" | "div";
}

export function Section({
  className,
  as: Tag = "section",
  ...props
}: SectionProps) {
  return (
    <Tag className={cn("py-8 sm:py-12 lg:py-16", className)} {...props} />
  );
}
