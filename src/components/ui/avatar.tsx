import * as React from "react";
import Image from "next/image";

import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "sm" | "default" | "lg";
}

const sizeClasses = {
  sm: "size-8 text-caption",
  default: "size-10 text-body-sm",
  lg: "size-14 text-body",
};

function Avatar({
  className,
  src,
  alt = "",
  fallback,
  size = "default",
  ...props
}: AvatarProps) {
  const initials =
    fallback ??
    alt
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-medium text-muted-foreground",
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="56px"
        />
      ) : (
        <span aria-hidden>{initials || "?"}</span>
      )}
    </div>
  );
}

export { Avatar };
