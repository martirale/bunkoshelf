import { connection } from "next/server";
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
  data?: Awaited<ReturnType<typeof getReaderStats>>;
};

function formatLoggedDate(
  value: string,
  lang: string | undefined,
  currentYear: number
) {
  const [yearRaw, monthRaw, dayRaw] = value.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (!year || !month || !day) {
    return "—";
  }

  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    ...(year !== currentYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  };

  return new Intl.DateTimeFormat(lang, options).format(date);
}

export default async function ReaderStatsPanel({
  lang,
  intl,
  bgColor = "bg-sand",
  textColor = "text-onix",
  mdCols,
  data: initialData,
}: ReaderStatsPanelProps) {
  if (!initialData) {
    await connection();
  }
  const stats = intl.stats as DictionarySection;
  const data = initialData ?? await getReaderStats();

  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const thisYear = now.getFullYear();

  const dailyReading = data?.dailyReading ?? [];
  const monthlyReads = data?.monthlyReads ?? [];
  const allReadDates = data?.allReadDates ?? [];

  let lastRead = "—";
  if (dailyReading.length > 0) {
    lastRead = formatLoggedDate(dailyReading[0].date, lang, thisYear);
  } else if (allReadDates.length > 0 && allReadDates[0].lastReadAt) {
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
        dailyReadingDates={dailyReading.map(({ date }) => date)}
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
