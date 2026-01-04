"use client";

import { useEffect, useState } from "react";
import { ArrowUpIcon, ArrowDownIcon, MinusIcon } from "lucide-react";
import { toZonedTime } from "date-fns-tz";
import { getReaderStats } from "@/actions/stats";

export default function TileMonthTrend({ title, bgColor, textColor }) {
  const [percentageChange, setPercentageChange] = useState("—");
  const [trend, setTrend] = useState(null);

  useEffect(() => {
    async function fetchTrend() {
      try {
        const data = await getReaderStats();
        const monthlyReads = data?.monthlyReads || [];

        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const now = toZonedTime(new Date(), timeZone);

        const thisMonth = now.getMonth() + 1;
        const lastMonth = thisMonth === 1 ? 12 : thisMonth - 1;
        const thisYear = now.getFullYear();
        const lastMonthYear = thisMonth === 1 ? thisYear - 1 : thisYear;

        const current =
          monthlyReads.find((m) => m.month === thisMonth)?.count ?? 0;
        const previous =
          monthlyReads.find((m) => m.month === lastMonth)?.count ?? 0;

        if (previous === 0 && current === 0) {
          setPercentageChange(0);
          setTrend("flat");
        } else if (previous === 0) {
          setPercentageChange(100);
          setTrend("up");
        } else {
          const diff = current - previous;
          const percent = Math.round((diff / previous) * 100);
          setPercentageChange(Math.abs(percent));
          setTrend(percent > 0 ? "up" : percent < 0 ? "down" : "flat");
        }
      } catch (error) {
        console.error("Error fetching trend:", error);
        setPercentageChange("—");
        setTrend(null);
      }
    }

    fetchTrend();
  }, []);

  const color =
    trend === "up"
      ? "text-green-500"
      : trend === "down"
      ? "text-red-500"
      : "text-gray-400";

  const IconComponent =
    trend === "up" ? ArrowUpIcon : trend === "down" ? ArrowDownIcon : MinusIcon;

  return (
    <div
      className={`h-[110px] rounded-lg ${bgColor} p-4 2xl:px-4 2xl:pt-4 2xl:pb-5 flex flex-col justify-between`}
    >
      <span className={`${textColor} text-sm uppercase`}>{title}</span>
      <div
        className={`font-boldonse ${textColor} 2xl:text-2xl leading-7.5 mt-2 flex items-center`}
      >
        <span>{percentageChange}%</span>
        <IconComponent size={24} className={`ml-2 ${color}`} />
      </div>
    </div>
  );
}
