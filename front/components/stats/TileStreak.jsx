"use client";

import { useEffect, useState } from "react";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";

export default function TileStreak({ title, intl, bgColor, textColor }) {
  const [streak, setStreak] = useState("—");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/stats/reader", { cache: "no-store" });
        const data = await res.json();
        const dailyReading = data?.dailyReading || [];

        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        const readDaySet = new Set(
          dailyReading.map(({ date }) => {
            const zoned = toZonedTime(new Date(date), timeZone);
            return format(zoned, "yyyy-MM-dd");
          })
        );

        const now = toZonedTime(new Date(), timeZone);
        let currentDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        let count = 0;

        while (true) {
          const localDate = toZonedTime(currentDate, timeZone);
          const dayKey = format(localDate, "yyyy-MM-dd");

          if (readDaySet.has(dayKey)) {
            count++;
            currentDate.setDate(currentDate.getDate() - 1);
          } else {
            break;
          }
        }

        setStreak(count.toString());
      } catch (error) {
        console.error("Error al calcular la racha de lectura:", error);
        setStreak("—");
      }
    }

    fetchData();
  }, []);

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
