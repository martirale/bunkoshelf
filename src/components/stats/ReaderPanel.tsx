import { getReaderStats } from "@/actions/stats";
import TileStreak from "./TileStreak";
import TileLastRead from "./TileLastRead";
import TileMonthRead from "./TileMonthRead";
import TileDaysRead from "./TileDaysRead";
import TileAllRead from "./TileAllRead";
import TileMonthTrend from "./TileMonthTrend";
import type { DictionarySection } from "@/lib/types";

type Trend = "up" | "down" | "flat" | null;

type ReaderStatsPanelProps = {
  lang?: string;
  intl: DictionarySection;
  bgColor?: string;
  textColor?: string;
  mdCols?: string;
};

export default async function ReaderStatsPanel({
  lang,
  intl,
  bgColor = "bg-sand",
  textColor = "text-onix",
  mdCols,
}: ReaderStatsPanelProps) {
  const stats = intl.stats as DictionarySection;
  const data = await getReaderStats();

  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const thisYear = now.getFullYear();

  const dailyReading = data?.dailyReading ?? [];
  const monthlyReads = data?.monthlyReads ?? [];
  const allReadDates = data?.allReadDates ?? [];

  const readDaySet = new Set(dailyReading.map(({ date }) => date));
  let currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let streak = 0;
  while (true) {
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, "0");
    const d = String(currentDate.getDate()).padStart(2, "0");
    if (readDaySet.has(`${y}-${m}-${d}`)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  let lastRead = "—";
  if (allReadDates.length > 0 && allReadDates[0].lastReadAt) {
    const date = new Date(allReadDates[0].lastReadAt);
    if (!isNaN(date.getTime())) {
      const options: Intl.DateTimeFormatOptions = {
        day: "numeric",
        month: "short",
        ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
      };
      lastRead = date.toLocaleDateString(lang, options);
    }
  }

  const monthCount = monthlyReads.find((e) => e.month === thisMonth)?.count ?? 0;
  const monthGoal = data?.monthlyGoal ?? null;

  const uniqueDays = new Set<number>();
  for (const { date } of dailyReading) {
    const [y, m, d] = date.split("-").map(Number);
    if (y === thisYear && m === thisMonth) uniqueDays.add(d);
  }
  const daysInMonth = new Date(thisYear, thisMonth, 0).getDate();

  const readCount = data?.allCompleted?.length ?? 0;
  const totalVolumes = data?.totalVolumes ?? 0;

  const lastMonthNum = thisMonth === 1 ? 12 : thisMonth - 1;
  const prevMonthCount = monthlyReads.find((m) => m.month === lastMonthNum)?.count ?? 0;
  let trend: Trend = null;
  let percentageChange: number | string = "—";
  if (prevMonthCount === 0 && monthCount === 0) {
    percentageChange = 0;
    trend = "flat";
  } else if (prevMonthCount === 0) {
    percentageChange = 100;
    trend = "up";
  } else {
    const diff = monthCount - prevMonthCount;
    const percent = Math.round((diff / prevMonthCount) * 100);
    percentageChange = Math.abs(percent);
    trend = percent > 0 ? "up" : percent < 0 ? "down" : "flat";
  }

  return (
    <section className={`grid grid-cols-2 ${mdCols} w-full gap-4`}>
      <TileStreak
        title={stats.streak as string}
        streak={streak}
        daysLabel={stats.days as string}
        bgColor={bgColor}
        textColor={textColor}
      />
      <TileLastRead
        title={stats.lastRead as string}
        lastRead={lastRead}
        bgColor={bgColor}
        textColor={textColor}
      />
      <TileDaysRead
        title={stats.daysRead as string}
        daysReadCount={uniqueDays.size}
        daysInMonth={daysInMonth}
        bgColor={bgColor}
        textColor={textColor}
      />
      <TileMonthRead
        title={stats.monthRead as string}
        count={monthCount}
        goal={monthGoal}
        bgColor={bgColor}
        textColor={textColor}
      />
      <TileAllRead
        title={stats.mangaRead as string}
        readCount={readCount}
        totalVolumes={totalVolumes}
        bgColor={bgColor}
        textColor={textColor}
      />
      <TileMonthTrend
        title={stats.prevMonth as string}
        percentageChange={percentageChange}
        trend={trend}
        bgColor={bgColor}
        textColor={textColor}
      />
    </section>
  );
}
