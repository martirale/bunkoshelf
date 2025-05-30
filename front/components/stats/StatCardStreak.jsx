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

    // Convertir las fechas a startOfDay locales para comparar días enteros en zona horaria local
    const readDays = allReadDates.map((dateStr) =>
      startOfDay(new Date(dateStr))
    );

    let streakCount = 0;
    let current = startOfDay(new Date());

    while (readDays.some((day) => isSameDay(day, current))) {
      streakCount++;
      // retroceder un día
      current = startOfDay(new Date(current.getTime() - 24 * 60 * 60 * 1000));
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
