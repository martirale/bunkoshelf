"use client";

import { useMemo } from "react";

export default function StatCardLastRead({ date, title, lang }) {
  const displayValue = useMemo(() => {
    if (!date) return "-";

    const value = new Date(date);
    const options = {
      day: "numeric",
      month: "short",
      ...(value.getFullYear() !== new Date().getFullYear()
        ? { year: "numeric" }
        : {}),
    };

    return value.toLocaleDateString(lang, options);
  }, [date, lang]);

  return (
    <div className="rounded-lg bg-sand p-4 flex flex-col justify-between">
      <span className="text-onix text-sm uppercase">{title}</span>
      <div className="font-boldonse text-onix text-base 2xl:text-2xl leading-7.5 mt-2 flex items-center">
        {displayValue}
      </div>
    </div>
  );
}
