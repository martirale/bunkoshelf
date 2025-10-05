"use client";

import { useEffect, useState } from "react";

export default function TileDaysRead({ title, bgColor, textColor }) {
  const [display, setDisplay] = useState("—");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/stats/reader", { cache: "no-store" });
        const data = await res.json();
        const dailyReading = data?.dailyReading || [];

        const now = new Date();
        const thisMonth = now.getMonth() + 1;
        const thisYear = now.getFullYear();

        const uniqueDays = new Set();

        dailyReading.forEach(({ date }) => {
          const [yearStr, monthStr, dayStr] = date.split("-");
          const year = parseInt(yearStr, 10);
          const month = parseInt(monthStr, 10);
          const day = parseInt(dayStr, 10);

          if (year === thisYear && month === thisMonth) {
            uniqueDays.add(day);
          }
        });

        const daysInMonth = new Date(thisYear, thisMonth, 0).getDate();
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
