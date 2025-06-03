"use client";

import { useEffect, useState } from "react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

export default function TileMonthTrend({ title, bgColor, textColor }) {
  const [percentageChange, setPercentageChange] = useState("—");
  const [trend, setTrend] = useState(null);

  useEffect(() => {
    async function fetchVolumes() {
      try {
        const res = await fetch("/api/stats/reader", { cache: "no-store" });
        const data = await res.json();
        const volumes = data?.volumesRead || [];

        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
        const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

        let currentMonthReads = 0;
        let previousMonthReads = 0;

        volumes.forEach((entry) => {
          const readDate = new Date(entry.lastReadAt);
          const m = readDate.getMonth();
          const y = readDate.getFullYear();

          if (m === thisMonth && y === thisYear) {
            currentMonthReads++;
          } else if (m === lastMonth && y === lastMonthYear) {
            previousMonthReads++;
          }
        });

        if (previousMonthReads === 0 && currentMonthReads === 0) {
          setPercentageChange(0);
          setTrend("flat");
        } else if (previousMonthReads === 0) {
          setPercentageChange(100);
          setTrend("up");
        } else {
          const diff = currentMonthReads - previousMonthReads;
          const percent = Math.round((diff / previousMonthReads) * 100);
          setPercentageChange(Math.abs(percent));
          setTrend(percent > 0 ? "up" : percent < 0 ? "down" : "flat");
        }
      } catch (error) {
        console.error("Error fetching volumes:", error);
        setPercentageChange("—");
        setTrend(null);
      }
    }

    fetchVolumes();
  }, []);

  const color =
    trend === "up"
      ? "text-green-500"
      : trend === "down"
      ? "text-red-500"
      : "text-gray-400";

  const IconComponent =
    trend === "up" ? ArrowUp : trend === "down" ? ArrowDown : Minus;

  return (
    <div
      className={`h-[110px] rounded-lg ${bgColor} p-4 2xl:px-4 2xl:pt-4 2xl:pb-5 flex flex-col justify-between`}
    >
      <span className={`${textColor} text-sm uppercase`}>{title}</span>
      <div
        className={`font-boldonse ${textColor} 2xl:text-2xl leading-7.5 mt-2 flex items-center`}
      >
        {percentageChange}
        <span className="text-sm">%</span>
        <IconComponent className={`w-5 h-5 ${color}`} />
      </div>
    </div>
  );
}
