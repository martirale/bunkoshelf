"use client";

import { useEffect, useState } from "react";
import { toZonedTime } from "date-fns-tz";

export default function TileDaysRead({ title, bgColor, textColor }) {
  const [display, setDisplay] = useState("—");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/stats/reader", { cache: "no-store" });
        const data = await res.json();
        const allReadDates = data?.allReadDates || [];

        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const now = toZonedTime(new Date(), timeZone);
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        const uniqueDays = new Set();

        allReadDates.forEach((entry) => {
          const zonedDate = toZonedTime(new Date(entry.lastReadAt), timeZone);

          if (!isNaN(zonedDate)) {
            if (
              zonedDate.getMonth() === thisMonth &&
              zonedDate.getFullYear() === thisYear
            ) {
              uniqueDays.add(zonedDate.getDate());
            }
          }
        });

        const daysInMonth = new Date(thisYear, thisMonth + 1, 0).getDate();
        setDisplay(`${uniqueDays.size} / ${daysInMonth}`);
      } catch (error) {
        console.error("Error fetching days read:", error);
        setDisplay("—");
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
        {display}
      </div>
    </div>
  );
}
