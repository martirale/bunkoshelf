"use client";

import { useEffect, useState } from "react";
import { toZonedTime } from "date-fns-tz";
import { getReaderStats } from "@/actions/stats";

export default function TileMonthRead({ title, bgColor, textColor }) {
  const [count, setCount] = useState("—");

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getReaderStats();
        const monthlyReads = data?.monthlyReads || [];

        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const now = toZonedTime(new Date(), timeZone);
        const thisMonth = now.getMonth() + 1;

        const currentMonthEntry = monthlyReads.find(
          (entry) => entry.month === thisMonth
        );

        setCount(currentMonthEntry?.count ?? 0);
      } catch (error) {
        console.error("Error fetching monthly reads:", error);
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
