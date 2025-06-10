"use client";

import { useEffect, useState } from "react";
import { toZonedTime, format } from "date-fns-tz";
import { format as formatDateFns } from "date-fns";

export default function TileStreak({ title, intl, bgColor, textColor }) {
  const [streak, setStreak] = useState("—");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/stats/reader");
        const data = await res.json();
        const allReadDates = data?.allReadDates || [];

        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        // Función para obtener la fecha en formato yyyy-MM-dd según zona horaria local
        const formatDate = (date) => {
          const zoned = toZonedTime(date, timeZone);
          return formatDateFns(zoned, "yyyy-MM-dd");
        };

        // Crear Set con días únicos donde hubo lectura
        const readDays = new Set(
          allReadDates.map((entry) => formatDate(new Date(entry.lastReadAt)))
        );

        // Empezamos desde hoy y vamos retrocediendo un día mientras haya lectura
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
