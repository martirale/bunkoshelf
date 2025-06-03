import React from "react";
import TileStreak from "./TileStreak";
import TileLastRead from "./TileLastRead";
import TileMonthRead from "./TileMonthRead";
import TileDaysRead from "./TileDaysRead";
import TileAllRead from "./TileAllRead";
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
      <TileAllRead
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
