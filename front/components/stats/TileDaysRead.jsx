"use client";

import { useEffect, useState } from "react";

export default function TileDaysRead({ title, bgColor, textColor }) {
  const [display, setDisplay] = useState("—");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/stats/reader");
        const data = await res.json();
        const allReadDates = data?.allReadDates || [];

        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        const uniqueDays = new Set();

        allReadDates.forEach((entry) => {
          const date = new Date(entry.lastReadAt);
          if (
            date.getMonth() === thisMonth &&
            date.getFullYear() === thisYear
          ) {
            const key = date.getDate();
            uniqueDays.add(key);
          }
        });

        const daysInMonth = new Date(thisYear, thisMonth + 1, 0).getDate();
        setDisplay(`${uniqueDays.size} / ${daysInMonth}`);
      } catch (error) {
        console.error("Error fetching days read:", error);
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
