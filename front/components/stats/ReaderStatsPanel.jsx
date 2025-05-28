import React from "react";
import { getReaderStats } from "@/lib/stats/readerStats";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { getDaysInMonth } from "date-fns";

export default async function ReaderStatsPanel({ intl }) {
  const stats = await getReaderStats();
  if (!stats) return null;

  const { currentMonth, previousMonth, totalCompleted } = stats;

  const now = new Date();
  const daysInMonth = getDaysInMonth(now);

  const diff = currentMonth.totalRead - previousMonth.totalRead;
  const percentageChange = previousMonth.totalRead
    ? Math.round((diff / previousMonth.totalRead) * 100)
    : 100;

  const trend = diff > 0 ? "up" : diff < 0 ? "down" : "same";

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
    <div className="rounded-lg bg-blackamber p-4 flex flex-col">
      <span className="text-sm uppercase">{title}</span>
      <div className="font-boldonse text-base md:text-2xl mt-2 flex items-center">
        {value}
        {trend && <IconComponent className={`${color} ml-2`} size={20} />}
      </div>
    </div>
  );
}
