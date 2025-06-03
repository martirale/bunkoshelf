import React from "react";
import TileLastRead from "./TileLastRead";
import TileStreak from "./TileStreak";
import TileDaysRead from "./TileDaysRead";
import TileMonthRead from "./TileMonthRead";
import TileMonthTrend from "./TileMonthTrend";

export default function ReaderStatsPanel({
  lang,
  intl,
  bgColor = "bg-sand",
  textColor = "text-onix",
  mdCols,
}) {
  return (
    <section className={`grid grid-cols-2 ${mdCols} gap-4`}>
      <TileStreak
        title={intl.home.streak}
        intl={intl}
        bgColor={bgColor}
        textColor={textColor}
      />
      <TileLastRead
        title={intl.home.lastRead}
        lang={lang}
        bgColor={bgColor}
        textColor={textColor}
      />
      <TileMonthRead
        title={intl.home.monthRead}
        bgColor={bgColor}
        textColor={textColor}
      />
      <TileDaysRead
        title={intl.home.daysRead}
        bgColor={bgColor}
        textColor={textColor}
      />
      <TileStat
        title={intl.home.mangaRead}
        bgColor={bgColor}
        textColor={textColor}
      />
      <TileMonthTrend
        title={intl.home.prevMonth}
        bgColor={bgColor}
        textColor={textColor}
      />
    </section>
  );
}

function TileStat({ title, value = "-", bgColor, textColor }) {
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
