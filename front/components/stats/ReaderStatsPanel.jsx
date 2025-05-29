import React from "react";
import { getReaderStats } from "@/lib/stats/readerStats";
import StatCardLastRead from "./StatCardLastRead";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { getDaysInMonth } from "date-fns";

export default async function ReaderStatsPanel({ lang, intl }) {
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
    <section className="grid grid-cols-2 md:grid-cols-6 gap-4">
      <StatCard
        title={intl.home.streak}
        value={`${stats.streakDays} ${intl.home.days}`}
      />
      <StatCardLastRead
        title={intl.home.lastRead}
        date={stats.lastReadDate}
        lang={lang}
      />
      <StatCard title={intl.home.monthRead} value={currentMonth.totalRead} />
      <StatCard
        title={intl.home.daysRead}
        value={`${currentMonth.readDays} / ${daysInMonth}`}
      />
      <StatCard title={intl.home.mangaRead} value={totalCompleted} />
      <StatCard
        title={intl.home.prevMonth}
        value={`${percentageChange}%`}
        trend={trend}
      />
    </section>
  );
}

function StatCard({ title, value, trend }) {
  const color =
    trend === "up"
      ? "text-green-500"
      : trend === "down"
      ? "text-red-500"
      : "text-gray-400";

  const IconComponent =
    trend === "up" ? ArrowUp : trend === "down" ? ArrowDown : Minus;

  return (
    <div className="rounded-lg bg-blackamber p-4 flex flex-col justify-between">
      <span className="text-sm uppercase">{title}</span>
      <div className="font-boldonse text-base 2xl:text-2xl leading-7.5 mt-2 flex items-center">
        {value}
        {trend && <IconComponent className={`${color} ml-2`} size={20} />}
      </div>
    </div>
  );
}
