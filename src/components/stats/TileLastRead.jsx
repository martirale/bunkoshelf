"use client";

import { useEffect, useState } from "react";
import { toZonedTime } from "date-fns-tz";
import { getReaderStats } from "@/actions/stats";

export default function TileLastRead({ title, lang, bgColor, textColor }) {
  const [lastRead, setLastRead] = useState("—");

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getReaderStats();

        const dates = data?.allReadDates ?? [];

        if (dates.length > 0 && dates[0].lastReadAt) {
          const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const mostRecentStr = dates[0].lastReadAt;
          const mostRecentUTC = new Date(mostRecentStr);
          const zonedDate = toZonedTime(mostRecentUTC, timeZone);

          if (!isNaN(zonedDate.getTime())) {
            const now = toZonedTime(new Date(), timeZone);

            const options = {
              day: "numeric",
              month: "short",
              ...(zonedDate.getFullYear() !== now.getFullYear()
                ? { year: "numeric" }
                : {}),
            };

            const formatted = zonedDate.toLocaleDateString(lang, options);
            setLastRead(formatted);
          } else {
            setLastRead("—");
          }
        } else {
          setLastRead("—");
        }
      } catch {
        setLastRead("—");
      }
    }

    fetchData();
  }, [lang]);

  return (
    <div
      className={`h-[110px] rounded-lg ${bgColor} p-4 2xl:px-4 2xl:pt-4 2xl:pb-5 flex flex-col justify-between`}
    >
      <span className={`${textColor} text-sm uppercase`}>{title}</span>
      <div
        className={`font-boldonse ${textColor} 2xl:text-2xl leading-7.5 mt-2 flex items-center`}
      >
        {lastRead}
      </div>
    </div>
  );
}
