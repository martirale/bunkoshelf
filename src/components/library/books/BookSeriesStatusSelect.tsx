"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import {
  CircleCheckBig,
  CircleFadingArrowUpIcon,
  CirclePauseIcon,
  CircleXIcon,
  type LucideIcon,
} from "lucide-react";
import { getBookSeriesStatus, updateBookSeriesStatus } from "@/actions/books-series-status";
import type { Dictionary } from "@/lib/types";

interface BookSeriesStatusSelectProps {
  seriesId: string;
  intl: Dictionary;
}

interface StatusOption {
  value: string;
  label: string;
  icon: LucideIcon;
}

const COLORS: Record<string, string> = {
  ONGOING: "text-cyan-500",
  FINISHED: "text-pearl",
  HIATUS: "text-yellow-500",
  CANCELLED: "text-red-500",
};

export default function BookSeriesStatusSelect({ seriesId, intl }: BookSeriesStatusSelectProps) {
  const books = intl.books as Record<string, string>;
  const options: StatusOption[] = [
    { value: "ONGOING", label: books.ongoing, icon: CircleFadingArrowUpIcon },
    { value: "FINISHED", label: books.finished, icon: CircleCheckBig },
    { value: "HIATUS", label: books.hiatus, icon: CirclePauseIcon },
    { value: "CANCELLED", label: books.cancelled, icon: CircleXIcon },
  ];
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);
  const currentOption = options.find((option) => option.value === currentStatus);
  const CurrentIcon = currentOption?.icon ?? CircleFadingArrowUpIcon;

  useEffect(() => {
    let active = true;
    void getBookSeriesStatus({ seriesId }).then((result) => {
      if (active && !("error" in result)) setCurrentStatus(result.status);
    });
    return () => { active = false; };
  }, [seriesId]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [isOpen]);

  const changeStatus = async (status: string) => {
    setIsLoading(true);
    try {
      const result = await updateBookSeriesStatus({ seriesId, status });
      if (!("error" in result)) {
        setCurrentStatus(result.status);
        setIsOpen(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative" ref={selectRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        disabled={isLoading}
        title={currentOption?.label ?? books.selectStatus}
        className="group cursor-pointer rounded-lg border border-blackamber bg-blackamber p-3 leading-none text-sand transition-all duration-300 hover:border-pearl hover:bg-pearl hover:text-onix 2xl:p-4"
      >
        <CurrentIcon
          size={20}
          className={clsx(COLORS[currentStatus ?? ""] ?? "text-sand", "transition-colors", currentStatus === "FINISHED" && "group-hover:text-onix")}
        />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full z-10 mt-2 min-w-[180px] overflow-hidden rounded-lg bg-blackamber shadow-lg">
          {options.map((option) => {
            const OptionIcon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => void changeStatus(option.value)}
                disabled={isLoading}
                className={clsx(
                  "flex w-full cursor-pointer items-center gap-3 px-4 py-3 transition-all duration-200",
                  currentStatus === option.value ? "bg-sand text-onix" : "text-sand hover:bg-pearl hover:text-onix",
                )}
              >
                <OptionIcon size={20} />
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
