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
        title={intl.stats.streak}
        lang={lang}
        intl={intl}
        bgColor={bgColor}
        textColor={textColor}
      />
      <TileLastRead
        title={intl.stats.lastRead}
        lang={lang}
        bgColor={bgColor}
        textColor={textColor}
      />
      <TileDaysRead
        title={intl.stats.daysRead}
        bgColor={bgColor}
        textColor={textColor}
      />
      <TileMonthRead
        title={intl.stats.monthRead}
        bgColor={bgColor}
        textColor={textColor}
      />
      <TileAllRead
        title={intl.stats.mangaRead}
        bgColor={bgColor}
        textColor={textColor}
      />
      <TileMonthTrend
        title={intl.stats.prevMonth}
        bgColor={bgColor}
        textColor={textColor}
      />
    </section>
  );
}
