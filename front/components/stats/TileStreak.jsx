"use client";

import { useEffect, useState } from "react";
import { toZonedTime } from "date-fns-tz";

export default function TileStreak({ title, intl, bgColor, textColor }) {
  const [streak, setStreak] = useState("—");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/stats/reader");
        const data = await res.json();
        const allReadDates = data?.allReadDates || [];

        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        const formatDate = (date) =>
          new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
          ).getTime();

        const readDays = new Set(
          allReadDates.map((entry) => {
            const zonedDate = toZonedTime(entry.lastReadAt, timeZone);
            return formatDate(zonedDate);
          })
        );

        const today = new Date();
        const todayKey = formatDate(today);

        if (!readDays.has(todayKey)) {
          setStreak("0");
          return;
        }

        let count = 0;
        let cursor = new Date();

        while (readDays.has(formatDate(cursor))) {
          count++;
          cursor.setDate(cursor.getDate() - 1);
        }

        setStreak(count.toString());
      } catch (error) {
        console.error("Error calculating streak:", error);
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
