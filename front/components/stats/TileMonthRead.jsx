"use client";

import { useEffect, useState } from "react";
import { toZonedTime } from "date-fns-tz";

export default function TileMonthRead({ title, bgColor, textColor }) {
  const [count, setCount] = useState("—");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/stats/reader", { cache: "no-store" });
        const data = await res.json();
        const volumesRead = data?.volumesRead || [];

        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const now = toZonedTime(new Date(), timeZone);
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        const thisMonthReads = volumesRead.filter((entry) => {
          const readDate = toZonedTime(new Date(entry.lastReadAt), timeZone);
          return (
            readDate.getMonth() === thisMonth &&
            readDate.getFullYear() === thisYear
          );
        });

        setCount(thisMonthReads.length ?? "—");
      } catch (error) {
        console.error("Error fetching month reads:", error);
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
        {count}
      </div>
    </div>
  );
}
