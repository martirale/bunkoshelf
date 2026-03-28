"use client";

import { useEffect, useState } from "react";
import { getReaderStats } from "@/actions/stats";

type TileDaysReadProps = {
  title: string;
  bgColor: string;
  textColor: string;
};

export default function TileDaysRead({ title, bgColor, textColor }: TileDaysReadProps) {
  const [daysReadCount, setDaysReadCount] = useState<number | null>(null);
  const [daysInMonth, setDaysInMonth] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getReaderStats();
        const dailyReading = data?.dailyReading || [];

        const now = new Date();
        const thisMonth = now.getMonth() + 1;
        const thisYear = now.getFullYear();

        const uniqueDays = new Set<number>();

        dailyReading.forEach(({ date }) => {
          const [yearStr, monthStr, dayStr] = date.split("-");
          const year = parseInt(yearStr, 10);
          const month = parseInt(monthStr, 10);
          const day = parseInt(dayStr, 10);

          if (year === thisYear && month === thisMonth) {
            uniqueDays.add(day);
          }
        });

        const dim = new Date(thisYear, thisMonth, 0).getDate();
        setDaysReadCount(uniqueDays.size);
        setDaysInMonth(dim);
      } catch (error) {
        console.error("Error fetching days read:", error);
        setDaysReadCount(null);
        setDaysInMonth(null);
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
        {daysReadCount == null ? (
          "—"
        ) : (
          <p className="m-0">
            {daysReadCount}/<span className="text-sm">{daysInMonth}</span>
          </p>
        )}
      </div>
    </div>
  );
}
