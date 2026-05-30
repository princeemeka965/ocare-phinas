import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Show full logo (default) or icon-only (cropped square) */
  variant?: "full" | "icon";
}

export function Logo({ className, variant = "full" }: LogoProps) {
  if (variant === "icon") {
    return (
      <div className={cn("relative size-10", className)}>
        <Image
          src="/OCARE_PHINAS_logo.png"
          alt="OCare Phinas"
          fill
          className="object-contain"
          priority
        />
      </div>
    );
  }

  return (
    <div className={cn("relative h-10 w-auto", className)}>
      <img
        src="https://res.cloudinary.com/campnet/image/upload/v1780091407/OCARE_PHINAS_logo_transparent_notagline_2x_ykplvm.png"
        alt="OCare Phinas Electronics"
        height={40}
        width={168}
        className="h-full w-auto object-contain"
      />
    </div>
  );
}
