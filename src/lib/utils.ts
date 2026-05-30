import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge doesn't know about this project's custom fluid type scale
 * (`text-display` … `text-micro`). Without registering them, it treats e.g.
 * `text-body` as a *text color* and silently drops a real color like
 * `text-white` when both appear on the same element. Register them under the
 * `font-size` group so colors and sizes no longer collide.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display",
            "h1",
            "h2",
            "h3",
            "body-lg",
            "body",
            "body-sm",
            "caption",
            "micro",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
