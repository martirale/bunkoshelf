import TileStreak from "./TileStreak";
import TileLastRead from "./TileLastRead";
import TileMonthRead from "./TileMonthRead";
import TileDaysRead from "./TileDaysRead";
import TileAllRead from "./TileAllRead";
import TileMonthTrend from "./TileMonthTrend";
import type { DictionarySection } from "@/lib/types";

type ReaderStatsPanelProps = {
  lang?: string;
  intl: DictionarySection;
  bgColor?: string;
  textColor?: string;
  mdCols?: string;
};

export default function ReaderStatsPanel({
  lang,
  intl,
  bgColor = "bg-sand",
  textColor = "text-onix",
  mdCols,
}: ReaderStatsPanelProps) {
  const stats = intl.stats as DictionarySection;

  return (
    <section className={`grid grid-cols-2 ${mdCols} w-full gap-4`}>
      <TileStreak
        title={stats.streak as string}
        intl={intl}
        bgColor={bgColor}
        textColor={textColor}
      />
      <TileLastRead
        title={stats.lastRead as string}
        lang={lang}
        bgColor={bgColor}
        textColor={textColor}
      />
      <TileDaysRead
        title={stats.daysRead as string}
        bgColor={bgColor}
        textColor={textColor}
      />
      <TileMonthRead
        title={stats.monthRead as string}
        bgColor={bgColor}
        textColor={textColor}
      />
      <TileAllRead
        title={stats.mangaRead as string}
        bgColor={bgColor}
        textColor={textColor}
      />
      <TileMonthTrend
        title={stats.prevMonth as string}
        bgColor={bgColor}
        textColor={textColor}
      />
    </section>
  );
}
