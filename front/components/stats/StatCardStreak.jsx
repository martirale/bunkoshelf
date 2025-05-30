"use client";

import { useMemo } from "react";
import { startOfDay, subDays, isSameDay } from "date-fns";

export default function StatCardStreak({
  allReadDates,
  title,
  intl,
  bgColor,
  textColor,
}) {
  const streak = useMemo(() => {
    if (!allReadDates || allReadDates.length === 0) return 0;

    // Set de fechas leídas en string (ej: "2024-05-30")
    const readDaySet = new Set(allReadDates);

    let streakCount = 0;
    let current = new Date();

    while (true) {
      const yyyy = current.getFullYear();
      const mm = String(current.getMonth() + 1).padStart(2, "0");
      const dd = String(current.getDate()).padStart(2, "0");
      const currentStr = `${yyyy}-${mm}-${dd}`;

      if (readDaySet.has(currentStr)) {
        streakCount++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }

    return streakCount;
  }, [allReadDates]);

  return (
    <div
      className={`h-[110px] rounded-lg ${bgColor} p-4 2xl:px-4 2xl:pt-4 2xl:pb-5 flex flex-col justify-between`}
    >
      <span className={`${textColor} text-sm uppercase`}>{title}</span>
      <div
        className={`font-boldonse ${textColor} 2xl:text-2xl leading-7.5 mt-2 flex items-center`}
      >
        {streak} {intl.home.days}
      </div>
    </div>
  );
}
