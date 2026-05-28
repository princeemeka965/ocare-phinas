import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  /** Show icon + wordmark (default) or icon only */
  variant?: "full" | "icon";
}

export function Logo({ className, variant = "full" }: LogoProps) {
  if (variant === "icon") {
    return (
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("size-10", className)}
        aria-label="OCare Phinas"
        role="img"
      >
        <title>OCare Phinas</title>
        <defs>
          <linearGradient id="ocp-icon-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop stopColor="#14b8a6" />
            <stop offset="1" stopColor="#0891b2" />
          </linearGradient>
        </defs>
        <rect width="64" height="64" rx="16" fill="url(#ocp-icon-bg)" />
        <circle cx="32" cy="32" r="17" stroke="rgba(255,255,255,0.88)" strokeWidth="2.8" />
        <circle cx="32" cy="32" r="6" fill="rgba(255,255,255,0.95)" />
        <circle cx="32" cy="15" r="2.8" fill="rgba(255,255,255,0.92)" />
        <circle cx="49" cy="32" r="2.8" fill="rgba(255,255,255,0.92)" />
        <circle cx="32" cy="49" r="2.8" fill="rgba(255,255,255,0.92)" />
        <circle cx="15" cy="32" r="2.8" fill="rgba(255,255,255,0.92)" />
        <polyline points="32,12.2 32,6 42,6" stroke="rgba(255,255,255,0.48)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="42" cy="6" r="1.8" fill="rgba(255,255,255,0.48)" />
        <polyline points="51.8,32 58,32 58,22" stroke="rgba(255,255,255,0.48)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="58" cy="22" r="1.8" fill="rgba(255,255,255,0.48)" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 268 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-10 w-auto", className)}
      aria-label="OCare Phinas Electronics"
      role="img"
    >
      <title>OCare Phinas</title>
      <defs>
        <linearGradient id="ocp-full-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14b8a6" />
          <stop offset="1" stopColor="#0891b2" />
        </linearGradient>
      </defs>

      {/* ── Icon badge ── */}
      <rect x="0" y="4" width="56" height="56" rx="14" fill="url(#ocp-full-bg)" />

      {/* O ring */}
      <circle cx="28" cy="32" r="15.5" stroke="rgba(255,255,255,0.88)" strokeWidth="2.5" />

      {/* Centre node */}
      <circle cx="28" cy="32" r="5.5" fill="rgba(255,255,255,0.95)" />

      {/* Cardinal nodes */}
      <circle cx="28" cy="16.5" r="2.5" fill="rgba(255,255,255,0.92)" />
      <circle cx="43.5" cy="32" r="2.5" fill="rgba(255,255,255,0.92)" />
      <circle cx="28" cy="47.5" r="2.5" fill="rgba(255,255,255,0.92)" />
      <circle cx="12.5" cy="32" r="2.5" fill="rgba(255,255,255,0.92)" />

      {/* Circuit trace — top */}
      <polyline
        points="28,14 28,7 37,7"
        stroke="rgba(255,255,255,0.48)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="37" cy="7" r="1.6" fill="rgba(255,255,255,0.48)" />

      {/* Circuit trace — right */}
      <polyline
        points="46,32 52,32 52,23"
        stroke="rgba(255,255,255,0.48)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="52" cy="23" r="1.6" fill="rgba(255,255,255,0.48)" />

      {/* ── Wordmark ── */}

      {/* "ELECTRONICS" eyebrow label */}
      <text
        x="74"
        y="22"
        fontFamily="'Inter', -apple-system, 'Segoe UI', Arial, sans-serif"
        fontSize="9"
        fontWeight="700"
        letterSpacing="3.2"
        fill="var(--color-primary)"
        opacity="0.75"
      >
        ELECTRONICS
      </text>

      {/* "OCare" — bold primary colour */}
      <text
        x="72"
        y="51"
        fontFamily="'Inter', -apple-system, 'Segoe UI', Arial, sans-serif"
        fontSize="28"
        fontWeight="800"
        letterSpacing="-0.6"
        fill="var(--color-primary)"
      >
        OCare
      </text>

      {/* "Phinas" — light weight, foreground colour so it adapts to dark mode */}
      <text
        x="161"
        y="51"
        fontFamily="'Inter', -apple-system, 'Segoe UI', Arial, sans-serif"
        fontSize="28"
        fontWeight="300"
        letterSpacing="-0.3"
        fill="var(--color-foreground)"
      >
        Phinas
      </text>
    </svg>
  );
}
