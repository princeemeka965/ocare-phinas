"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export function RadioGroup({
  name,
  options,
  value,
  defaultValue,
  onChange,
  className,
  orientation = "vertical",
}: RadioGroupProps) {
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const current = value ?? internal;

  return (
    <div
      role="radiogroup"
      className={cn(
        "flex gap-3",
        orientation === "vertical" ? "flex-col" : "flex-row flex-wrap",
        className,
      )}
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={cn(
            "flex cursor-pointer items-center gap-2.5",
            option.disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <span className="relative inline-flex size-5 shrink-0">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={current === option.value}
              disabled={option.disabled}
              onChange={() => {
                if (value === undefined) setInternal(option.value);
                onChange?.(option.value);
              }}
              className="peer size-5 appearance-none rounded-full border border-input bg-background shadow-xs outline-none checked:border-[5px] checked:border-primary focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed"
            />
          </span>
          <Label className="cursor-pointer font-normal">{option.label}</Label>
        </label>
      ))}
    </div>
  );
}
