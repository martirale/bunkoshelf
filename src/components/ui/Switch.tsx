"use client";

import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "type"> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export default function Switch({ checked, onCheckedChange, className, ...props }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={clsx(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lilah",
        checked ? "bg-lilah" : "bg-neutral-700",
        className
      )}
      {...props}
    >
      <span className={clsx("absolute left-1 top-1 h-5 w-5 rounded-full bg-pearl transition-transform", checked ? "translate-x-5" : "translate-x-0")} />
    </button>
  );
}
