"use client";

import Link from "next/link";
import { ChevronDownIcon, ChevronUpIcon, type LucideIcon } from "lucide-react";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";

export interface MobileSecondaryNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  isActive: boolean;
  badge?: string | number | null;
}

interface MobileSecondaryNavProps {
  items: MobileSecondaryNavItem[];
}

export default function MobileSecondaryNav({ items }: MobileSecondaryNavProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const activeItem = useMemo(
    () => items.find((item) => item.isActive) ?? items[0],
    [items],
  );

  useEffect(() => {
    setOpen(false);
  }, [activeItem?.href]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  if (!activeItem) {
    return null;
  }

  const ActiveIcon = activeItem.icon;

  return (
    <div ref={containerRef} className="md:hidden mt-4 relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 p-4 rounded-lg bg-sand text-onix leading-tight transition-all duration-300"
      >
        <span className="flex items-center min-w-0">
          <ActiveIcon size={20} className="mr-2 shrink-0" />
          <span className="truncate">{activeItem.label}</span>
          {activeItem.badge !== undefined && activeItem.badge !== null && (
            <span className="ml-2 text-xs px-2 py-0.5 rounded-sm bg-pearl shrink-0 uppercase">
              {activeItem.badge}
            </span>
          )}
        </span>
        {open ? (
          <ChevronUpIcon size={20} className="shrink-0" />
        ) : (
          <ChevronDownIcon size={20} className="shrink-0" />
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 z-20 rounded-lg bg-blackamber p-2">
          <nav className="space-y-1">
            {items.map(({ href, icon: Icon, label, isActive, badge }) => (
              <Link
                key={href}
                href={href}
                prefetch={false}
                onClick={() => setOpen(false)}
                className={clsx(
                  "flex items-center justify-between gap-3 rounded p-3 leading-tight transition-all duration-300",
                  isActive
                    ? "bg-sand text-onix"
                    : "text-sand hover:bg-onix hover:text-pearl",
                )}
              >
                <span className="flex items-center min-w-0">
                  <Icon size={20} className="mr-2 shrink-0" />
                  <span className="truncate">{label}</span>
                </span>
                {badge !== undefined && badge !== null && (
                  <span
                    className={clsx(
                      "text-xs px-2 py-0.5 rounded-sm shrink-0 uppercase",
                      isActive ? "bg-pearl text-onix" : "bg-sand text-onix",
                    )}
                  >
                    {badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
