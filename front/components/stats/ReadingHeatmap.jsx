"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import {
  format,
  startOfToday,
  subDays,
  addDays,
  getMonth,
  startOfWeek,
  eachDayOfInterval,
} from "date-fns";

const DAYS_TO_DISPLAY = 365;

export default function ReadingHeatmap({ intl }) {
  const [weeks, setWeeks] = useState([]);
  const [monthLabels, setMonthLabels] = useState([]);

  useEffect(() => {
    async function loadData() {
      const res = await fetch("/api/stats/reader", { cache: "no-store" });
      const json = await res.json();
      const dailyReading = json?.dailyReading || [];

      const today = startOfToday();
      const startDate = startOfWeek(subDays(today, DAYS_TO_DISPLAY - 1), {
        weekStartsOn: 0,
      });

      const daysArray = eachDayOfInterval({ start: startDate, end: today });

      const activityDates = new Set(dailyReading.map((entry) => entry.date));

      const tempWeeks = [];

      for (let i = 0; i < daysArray.length; i += 7) {
        const week = [];

        for (let j = 0; j < 7; j++) {
          const date = daysArray[i + j];
          if (!date) break;

          const iso = format(date, "yyyy-MM-dd");
          week.push({
            date: iso,
            active: activityDates.has(iso),
            rawDate: date,
          });
        }

        tempWeeks.push(week);
      }

      setWeeks(tempWeeks);

      const labels = [];
      let lastMonth = null;

      for (let i = 0; i < tempWeeks.length; i++) {
        const firstDay = tempWeeks[i].find(Boolean);
        if (firstDay) {
          const month = getMonth(firstDay.rawDate);
          if (month !== lastMonth) {
            labels.push(intl.months[month + 1]);
            lastMonth = month;
          } else {
            labels.push("");
          }
        } else {
          labels.push("");
        }
      }

      setMonthLabels(labels);
    }

    loadData();
  }, [intl]);

  return (
    <div className="bg-blackamber rounded-lg p-4 mt-4">
      <h2 className="text-base mb-4">{intl.stats.daysReadYear}</h2>

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
