"use client";

import { useEffect, useState } from "react";

export default function TileLastRead({ title, lang, bgColor, textColor }) {
  const [lastRead, setLastRead] = useState("—");

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/stats/reader", { cache: "no-store" });
        const data = await res.json();

        const dates = data?.allReadDates ?? [];

        if (dates.length > 0 && dates[0].lastReadAt) {
          const mostRecentStr = dates[0].lastReadAt;
          const mostRecent = new Date(mostRecentStr);

          if (!isNaN(mostRecent.getTime())) {
            const now = new Date();
            const options = {
              day: "numeric",
              month: "short",
              ...(mostRecent.getFullYear() !== now.getFullYear()
                ? { year: "numeric" }
                : {}),
            };
            const formatted = mostRecent.toLocaleDateString(lang, options);
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
