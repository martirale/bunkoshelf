import React from "react";
import { getReaderStats } from "@/lib/stats/readerStats";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

export default async function ReaderStatsPanel() {
  const stats = await getReaderStats();
  if (!stats) return null;

  const { currentMonth, previousMonth, totalCompleted } = stats;

  const diff = currentMonth.totalRead - previousMonth.totalRead;
  const percentageChange = previousMonth.totalRead
    ? Math.round((diff / previousMonth.totalRead) * 100)
    : 100;

  const trend = diff > 0 ? "up" : diff < 0 ? "down" : "same";

  return (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard title="Leídos este mes" value={currentMonth.totalRead} />
      <StatCard title="Días con lectura" value={currentMonth.readDays} />
      <StatCard title="Mangas completados" value={totalCompleted} />
      <StatCard
        title="Comparado al mes anterior"
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
      <div className="text-2xl font-bold mt-1 flex items-center">
        {value}
        {trend && <IconComponent className={`${color} ml-2`} size={20} />}
      </div>
    </div>
  );
}
