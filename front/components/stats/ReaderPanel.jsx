import React from "react";
import { getReaderStats } from "@/lib/stats/readerStats";
import TileLastRead from "./TileLastRead";
import TileStreak from "./TileStreak";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { getDaysInMonth } from "date-fns";

export default async function ReaderStatsPanel({
  lang,
  intl,
  bgColor = "bg-sand",
  textColor = "text-onix",
}) {
  const stats = await getReaderStats();
  if (!stats) return null;

  const { currentMonth, previousMonth, totalCompleted } = stats;

  const now = new Date();
  const daysInMonth = getDaysInMonth(now);

  let percentageChange = 0;
  if (previousMonth.totalRead === 0 && currentMonth.totalRead === 0) {
    percentageChange = 0;
  } else if (previousMonth.totalRead === 0) {
    percentageChange = 100;
  } else {
    const diff = currentMonth.totalRead - previousMonth.totalRead;
    percentageChange = Math.round((diff / previousMonth.totalRead) * 100);
  }

  const trend =
    percentageChange > 0 ? "up" : percentageChange < 0 ? "down" : "same";

  return (
    <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <TileStreak
        title={intl.home.streak}
        allReadDates={stats.allReadDates}
        intl={intl}
        bgColor={bgColor}
        textColor={textColor}
      />
      <TileLastRead
        title={intl.home.lastRead}
        date={stats.lastReadDate}
        lang={lang}
        bgColor={bgColor}
        textColor={textColor}
      />
      <TileStat
        title={intl.home.monthRead}
        value={currentMonth.totalRead}
        bgColor={bgColor}
        textColor={textColor}
      />
      <TileStat
        title={intl.home.daysRead}
        value={`${currentMonth.readDays} / ${daysInMonth}`}
        bgColor={bgColor}
        textColor={textColor}
      />
      <TileStat
        title={intl.home.mangaRead}
        value={totalCompleted}
        bgColor={bgColor}
        textColor={textColor}
      />
      <TileStat
        title={intl.home.prevMonth}
        value={`${percentageChange}%`}
        trend={trend}
        bgColor={bgColor}
        textColor={textColor}
      />
    </section>
  );
}

function TileStat({ title, value, trend, bgColor, textColor }) {
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
        {value}
        {trend && <IconComponent className={`${color} ml-2`} size={20} />}
      </div>
    </div>
  );
}
