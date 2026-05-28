"use client";

import { X, CheckCircle2, XCircle, Info, AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";
import { useToastStore, type ToastVariant } from "@/store/toastStore";

const icons: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden />,
  error: <XCircle className="size-5 shrink-0 text-destructive" aria-hidden />,
  info: <Info className="size-5 shrink-0 text-primary" aria-hidden />,
  warning: <AlertTriangle className="size-5 shrink-0 text-warning" aria-hidden />,
};

const styles: Record<ToastVariant, string> = {
  success: "border-success/30 bg-success/10",
  error: "border-destructive/30 bg-destructive/10",
  info: "border-primary/30 bg-primary/10",
  warning: "border-warning/40 bg-warning/10",
};

export function ToastContainer() {
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 w-full max-w-sm pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-sm",
            "animate-[fade-in-up_0.3s_ease-out_forwards]",
            styles[t.variant],
          )}
        >
          {icons[t.variant]}
          <div className="flex-1 min-w-0">
            {t.title && (
              <p className="text-body-sm font-semibold leading-snug">{t.title}</p>
            )}
            <p className="text-body-sm text-muted-foreground">{t.message}</p>
          </div>
          <button
            onClick={() => dismiss(t.id)}
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
