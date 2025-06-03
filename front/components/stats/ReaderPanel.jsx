import React from "react";
import { getReaderStats } from "@/lib/stats/readerStats";
import TileLastRead from "./TileLastRead";
import TileStreak from "./TileStreak";
import TileDaysRead from "./TileDaysRead";
import TileMonthRead from "./TileMonthRead";
import TileMonthTrend from "./TileMonthTrend";

export default async function ReaderStatsPanel({
  lang,
  intl,
  bgColor = "bg-sand",
  textColor = "text-onix",
  mdCols,
}) {
  const stats = await getReaderStats();
  if (!stats) return null;

  const { currentMonth, previousMonth, totalCompleted } = stats;

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
    <section className={`grid grid-cols-2 ${mdCols} gap-4`}>
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
      <TileMonthRead
        title={intl.home.monthRead}
        totalRead={currentMonth.totalRead}
        bgColor={bgColor}
        textColor={textColor}
      />
      <TileDaysRead
        title={intl.home.daysRead}
        readDays={currentMonth.readDays}
        bgColor={bgColor}
        textColor={textColor}
      />
      <TileStat
        title={intl.home.mangaRead}
        value={totalCompleted}
        bgColor={bgColor}
        textColor={textColor}
      />
      <TileMonthTrend
        title={intl.home.prevMonth}
        percentageChange={percentageChange}
        trend={trend}
        bgColor={bgColor}
        textColor={textColor}
      />
    </section>
  );
}

function TileStat({ title, value, bgColor, textColor }) {
  return (
    <div
      className={`h-[110px] rounded-lg ${bgColor} p-4 2xl:px-4 2xl:pt-4 2xl:pb-5 flex flex-col justify-between`}
    >
      <span className={`${textColor} text-sm uppercase`}>{title}</span>
      <div
        className={`font-boldonse ${textColor} 2xl:text-2xl leading-7.5 mt-2 flex items-center`}
      >
        {value}
      </div>
    </div>
  );
}
