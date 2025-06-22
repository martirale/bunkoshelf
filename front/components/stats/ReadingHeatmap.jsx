import prisma from "@/lib/prisma";
import {
  format,
  startOfToday,
  subDays,
  getDay,
  getMonth,
  startOfWeek,
  addDays,
} from "date-fns";
import clsx from "clsx";

const DAYS_TO_DISPLAY = 365;
const MONTHS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

export default async function ReadingHeatmap({ userId }) {
  const dailyReading = await prisma.dailyReadingLog.findMany({
    where: { userId },
    select: { date: true },
  });

  const activityDates = new Set(
    dailyReading.map((entry) => format(new Date(entry.date), "yyyy-MM-dd"))
  );

  const today = startOfToday();
  const startDate = startOfWeek(subDays(today, DAYS_TO_DISPLAY - 1), {
    weekStartsOn: 0,
  });

  const totalDays = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
  const weeks = [];

  for (let i = 0; i < totalDays; i += 7) {
    const week = [];
    for (let j = 0; j < 7; j++) {
      const date = addDays(startDate, i + j);
      if (date > today) break;

      const iso = format(date, "yyyy-MM-dd");
      week.push({
        date: iso,
        active: activityDates.has(iso),
        rawDate: date,
      });
    }
    weeks.push(week);
  }

  const monthLabels = [];
  let lastMonth = null;

  for (let i = 0; i < weeks.length; i++) {
    const week = weeks[i];
    const firstDay = week.find(Boolean);
    if (firstDay) {
      const month = getMonth(firstDay.rawDate);
      if (month !== lastMonth) {
        monthLabels.push(MONTHS[month]);
        lastMonth = month;
      } else {
        monthLabels.push("");
      }
    } else {
      monthLabels.push("");
    }
  }

  return (
    <div className="bg-blackamber rounded-lg p-4 mt-4">
      <h2 className="text-base mb-4">Días leídos</h2>

      <div className="flex flex-col gap-1 w-full overflow-x-auto">
        <div className="min-w-[960px] 2xl:min-w-0 w-fit">
          <div className="grid grid-cols-53 gap-2 text-xs mb-1">
            {monthLabels.map((label, i) => (
              <div key={i} className="text-center h-4 uppercase">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-53 gap-2">
            {weeks.map((week, i) => (
              <div key={i} className="flex flex-col gap-2">
                {Array.from({ length: 7 }).map((_, j) => {
                  const day = week[j];
                  return (
                    <div
                      key={j}
                      title={day?.date || ""}
                      className={clsx(
                        "w-3 h-3 rounded-sm transition-colors duration-300",
                        day
                          ? day.active
                            ? "bg-lilah hover:brightness-110"
                            : "bg-neutral-700"
                          : "invisible"
                      )}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
