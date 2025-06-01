"use client";

import { ArrowUp, ArrowDown, Minus } from "lucide-react";

export default function TileMonthTrend({
  title,
  percentageChange,
  trend,
  bgColor,
  textColor,
}) {
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
        className={`font-boldonse ${textColor} 2xl:text-2xl leading-7.5 mt-2 flex items-center gap-2`}
      >
        {percentageChange}%<IconComponent className={`w-5 h-5 ${color}`} />
      </div>
    </div>
  );
}
