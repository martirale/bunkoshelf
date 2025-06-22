import prisma from "@/lib/prisma";
import { format, startOfToday, subDays, getDay } from "date-fns";
import clsx from "clsx";

const DAYS_TO_DISPLAY = 365;

export default async function ReadingHeatmap({ userId }) {
  const dailyReading = await prisma.dailyReadingLog.findMany({
    where: { userId },
    select: { date: true },
  });

  const activityDates = new Set(
    dailyReading.map((entry) => format(new Date(entry.date), "yyyy-MM-dd"))
  );

  const today = startOfToday();
  const days = [];

  for (let i = DAYS_TO_DISPLAY - 1; i >= 0; i--) {
    const date = subDays(today, i);
    days.push({
      date: format(date, "yyyy-MM-dd"),
      weekday: getDay(date),
      active: activityDates.has(format(date, "yyyy-MM-dd")),
    });
  }

  const startPadding = days.length > 0 ? days[0].weekday : 0;
  const paddedDays = [...Array(startPadding).fill(null), ...days];

  return (
    <div className="bg-blackamber rounded-lg p-4 mt-4">
      <h2 className="text-base mb-4">Días leídos</h2>
      <div className="grid grid-cols-53 gap-2">
        {paddedDays.map((entry, i) => (
          <div
            key={i}
            title={entry?.date ?? ""}
            className={clsx(
              "w-3 h-3 rounded-sm transition-colors duration-200",
              entry
                ? entry.active
                  ? "bg-lilah hover:brightness-110"
                  : "bg-neutral-700"
                : ""
            )}
          />
        ))}
      </div>
    </div>
  );
}
