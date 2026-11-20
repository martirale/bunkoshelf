"use client";

import { useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";
import Accordion from "@/components/ui/Accordion";
import Button from "@/components/ui/Button";
import {
  readFilterSelection,
  updateFilterParams,
  type FilterGroup,
} from "@/lib/libraryFilters";
import type { DictionarySection } from "@/lib/types";

interface FilterDrawerProps {
  intl: DictionarySection;
  groups: FilterGroup[];
  offline?: boolean;
  renderHeading?: (applied: Record<string, string[]>) => ReactNode;
}

export default function FilterDrawer({ intl, groups, offline = false, renderHeading }: FilterDrawerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [selection, setSelection] = useState<Record<string, string[]>>({});
  const labels = intl.filters as DictionarySection;
  const applied = readFilterSelection(new URLSearchParams(searchParams.toString()), groups);
  const count = Object.values(applied).reduce((total, values) => total + values.length, 0);

  function open() {
    setSelection(applied);
    setIsOpen(true);
  }

  function toggle(key: string, value: string) {
    setSelection((current) => {
      const values = current[key] ?? [];
      return {
        ...current,
        [key]: values.includes(value)
          ? values.filter((entry) => entry !== value)
          : [...values, value],
      };
    });
  }

  function apply(next: Record<string, string[]>) {
    const params = updateFilterParams(new URLSearchParams(searchParams.toString()), groups, next);
    const href = `?${params.toString()}`;
    if (offline) {
      window.history.pushState({}, "", href);
      window.dispatchEvent(new Event("bunko:offline-navigate"));
    } else {
      router.push(href);
    }
    setIsOpen(false);
  }

  return (
    <>
      {renderHeading?.(applied)}
      <Button
        type="button"
        onClick={open}
        variant={count ? "accent" : "light"}
        size="small"
        aria-label={labels.open as string}
      >
        <span className="uppercase">
          {count ? `${labels.filtering} (x${count})` : labels.filter as string}
        </span>
      </Button>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-40"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed top-0 right-0 h-full w-80 2xl:w-90 bg-onix z-50 transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"} flex flex-col`}
        aria-label={labels.filters as string}
        inert={!isOpen}
      >
        <header className="p-4 flex justify-between items-center">
          <h2>{labels.filters as string}</h2>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label={labels.close as string}
            className="hover:text-lilah cursor-pointer transition-all duration-300"
          >
            <ChevronRightIcon size={28} className="-mr-1" />
          </button>
        </header>
        <div className="p-4 flex flex-col gap-4 flex-grow min-h-0 overflow-y-auto">
          {groups.map((group) => (
            <Accordion key={group.key} title={group.label}>
              <ul className="space-y-1 max-h-44 md:max-h-64 overflow-auto pr-2">
                {group.options.map((option) => (
                  <li key={option.value}>
                    <label className="inline-flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selection[group.key]?.includes(option.value) ?? false}
                        onChange={() => toggle(group.key, option.value)}
                      />
                      <span className={group.commaSeparated ? "capitalize" : undefined}>
                        {option.label}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </Accordion>
          ))}
        </div>
        <footer className="p-4 flex justify-between gap-4">
          <Button onClick={() => apply({})} variant="light" className="w-full px-2 py-3">
            {labels.clean as string}
          </Button>
          <Button onClick={() => apply(selection)} variant="light" className="w-full px-2 py-3">
            {labels.apply as string}
          </Button>
        </footer>
      </aside>
    </>
  );
}
