"use client";

import { useState } from "react";
import { LibraryBigIcon } from "lucide-react";
import { setOthersLibraryMode } from "@/actions/app-settings";
import clsx from "clsx";
import type { Dictionary } from "@/lib/types";

interface LibraryModeTileProps {
  intl: Dictionary;
  initialEnabled: boolean;
}

export default function LibraryModeTile({
  intl,
  initialEnabled,
}: LibraryModeTileProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, setIsPending] = useState(false);

  const handleChange = async (nextValue: boolean) => {
    if (isPending) return;

    setEnabled(nextValue);
    setIsPending(true);

    const result = await setOthersLibraryMode(nextValue);

    if (result?.error) {
      setEnabled(!nextValue);
      setIsPending(false);
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set("_libraryMode", String(Date.now()));
    window.location.assign(url.toString());
  };

  return (
    <div className="rounded-lg bg-blackamber p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="flex items-center text-base mb-2">
            <LibraryBigIcon size={20} className="mr-2" />
            {intl.settings.othersLibraryTitle as string}
          </h3>
          <p className="text-sm text-neutral-400">
            {intl.settings.othersLibraryDesc as string}
          </p>
        </div>

        <label className="inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={enabled}
            disabled={isPending}
            onChange={(event) => handleChange(event.target.checked)}
            className="peer sr-only"
          />
          <span
            className={clsx(
              "relative h-7 w-13 rounded-full transition-colors",
              "after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-pearl after:transition-transform",
              enabled ? "bg-lilah after:translate-x-6" : "bg-onix"
            )}
          />
        </label>
      </div>

      <p className="mt-4 text-xs uppercase text-neutral-500">
        {enabled
          ? (intl.settings.othersLibraryEnabled as string)
          : (intl.settings.othersLibraryDisabled as string)}
      </p>
    </div>
  );
}
