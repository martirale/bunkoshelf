"use client";

import { useEffect, useState } from "react";
import { toZonedTime } from "date-fns-tz";
import { getReaderStats } from "@/actions/stats";

type TileMonthReadProps = {
  title: string;
  bgColor: string;
  textColor: string;
};

export default function TileMonthRead({ title, bgColor, textColor }: TileMonthReadProps) {
  const [count, setCount] = useState<number | string>("—");
  const [goal, setGoal] = useState<number | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getReaderStats();
        const monthlyReads = data?.monthlyReads || [];

        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const now = toZonedTime(new Date(), timeZone);
        const thisMonth = now.getMonth() + 1;

        const currentMonthEntry = monthlyReads.find(
          (entry) => entry.month === thisMonth
        );

        setCount(currentMonthEntry?.count ?? 0);
        if (data?.monthlyGoal !== null && data?.monthlyGoal !== undefined) {
          setGoal(data.monthlyGoal);
        }
      } catch (error) {
        console.error("Error fetching monthly reads:", error);
      }
    }

    fetchData();
  }, []);

  return (
    <div
      className={`h-[110px] rounded-lg ${bgColor} p-4 2xl:px-4 2xl:pt-4 2xl:pb-5 flex flex-col justify-between`}
    >
      <span className={`${textColor} text-sm uppercase`}>{title}</span>
      <div
        className={`font-boldonse ${textColor} 2xl:text-2xl leading-7.5 mt-2 flex items-center`}
      >
        <p>
          {count}
          {goal !== null && (
            <>/<span className="text-sm">{goal}</span></>
          )}
        </p>
      </div>
    </div>
  );
}
