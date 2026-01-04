"use client";

import { useEffect, useState } from "react";
import { getReaderStats } from "@/actions/stats";

export default function TileStreak({ title, intl, bgColor, textColor }) {
  const [streak, setStreak] = useState("—");

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getReaderStats();
        const dailyReading = data?.dailyReading || [];

        const readDaySet = new Set(dailyReading.map(({ date }) => date));

        const now = new Date();
        let currentDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        let count = 0;

        while (true) {
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, "0");
          const day = String(currentDate.getDate()).padStart(2, "0");
          const dayKey = `${year}-${month}-${day}`;

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
        {streak} {intl.stats.days}
      </div>
    </div>
  );
}
