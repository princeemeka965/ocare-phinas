"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
  value?: string;
  onChange?: (id: string) => void;
  className?: string;
}

export function Tabs({
  items,
  defaultTab,
  value,
  onChange,
  className,
}: TabsProps) {
  const [internal, setInternal] = React.useState(
    defaultTab ?? items[0]?.id ?? "",
  );
  const active = value ?? internal;
  const activeItem = items.find((t) => t.id === active) ?? items[0];

  return (
    <div className={cn("w-full", className)}>
      <div
        role="tablist"
        className="inline-flex h-10 w-full items-center justify-start gap-1 rounded-lg bg-muted p-1 sm:w-auto"
      >
        {items.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            disabled={tab.disabled}
            onClick={() => {
              if (value === undefined) setInternal(tab.id);
              onChange?.(tab.id);
            }}
            className={cn(
              "inline-flex flex-1 items-center justify-center rounded-md px-3 py-1.5 text-body-sm font-medium whitespace-nowrap transition-colors sm:flex-initial",
              active === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
              tab.disabled && "pointer-events-none opacity-50",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="mt-4">
        {activeItem?.content}
      </div>
    </div>
  );
}
